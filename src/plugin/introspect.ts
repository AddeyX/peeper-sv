import fs from "node:fs/promises";
import ts from "typescript";
import { svelte2tsx } from "svelte2tsx";
import type { PropSchema, PropKind } from "../shared/types.js";

export interface IntrospectInput {
  absPath: string;
  /** User project root, used to locate tsconfig and resolve imports. */
  projectRoot: string;
}

export async function introspect(input: IntrospectInput): Promise<PropSchema[]> {
  const source = await fs.readFile(input.absPath, "utf8");

  if (!/<script[^>]*\blang=["']ts["']/.test(source)) {
    return [];
  }

  const tsx = svelte2tsx(source, { filename: input.absPath, isTsFile: true });
  const synthName = input.absPath + ".tsx";

  const host = makeHost(synthName, tsx.code);
  const program = ts.createProgram({
    rootNames: [synthName],
    options: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.Preserve,
      strict: true,
      allowJs: false,
      skipLibCheck: true,
      noEmit: true,
    },
    host,
  });

  const sourceFile = program.getSourceFile(synthName);
  if (!sourceFile) return [];

  const checker = program.getTypeChecker();
  return extractPropsFromTsx(sourceFile, checker);
}

function makeHost(filename: string, code: string): ts.CompilerHost {
  const base = ts.createCompilerHost({}, true);
  return {
    ...base,
    getSourceFile: (name, version) => {
      if (name === filename) {
        return ts.createSourceFile(name, code, ts.ScriptTarget.ESNext, true);
      }
      return base.getSourceFile(name, version);
    },
    fileExists: (name) => name === filename || base.fileExists(name),
    readFile: (name) => (name === filename ? code : base.readFile(name)),
  };
}

function extractPropsFromTsx(
  sf: ts.SourceFile,
  checker: ts.TypeChecker,
): PropSchema[] {
  let propsTypeNode: ts.TypeNode | undefined;
  let propsBinding: ts.BindingPattern | undefined;

  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isIdentifier(node.initializer.expression) &&
      node.initializer.expression.text === "$props"
    ) {
      if (node.type) propsTypeNode = node.type;
      if (ts.isObjectBindingPattern(node.name)) propsBinding = node.name;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  if (!propsTypeNode) return [];

  const type = checker.getTypeFromTypeNode(propsTypeNode);
  const defaults = collectDefaults(propsBinding);

  return type.getProperties().map((sym) => toPropSchema(sym, checker, defaults));
}

function collectDefaults(
  binding: ts.BindingPattern | undefined,
): Map<string, string | number | boolean> {
  const out = new Map<string, string | number | boolean>();
  if (!binding || !ts.isObjectBindingPattern(binding)) return out;
  for (const el of binding.elements) {
    if (!ts.isBindingElement(el)) continue;
    const name = el.propertyName
      ? ts.isIdentifier(el.propertyName)
        ? el.propertyName.text
        : undefined
      : ts.isIdentifier(el.name)
        ? el.name.text
        : undefined;
    if (!name || !el.initializer) continue;
    const lit = literalValue(el.initializer);
    if (lit !== undefined) out.set(name, lit);
  }
  return out;
}

function literalValue(
  node: ts.Expression,
): string | number | boolean | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  ) {
    return -Number(node.operand.text);
  }
  return undefined;
}

function toPropSchema(
  sym: ts.Symbol,
  checker: ts.TypeChecker,
  defaults: Map<string, string | number | boolean>,
): PropSchema {
  const name = sym.getName();
  const decl = sym.valueDeclaration ?? sym.declarations?.[0];
  const isOptionalFlag = !!(sym.flags & ts.SymbolFlags.Optional);
  const hasDefault = defaults.has(name);
  const required = !isOptionalFlag && !hasDefault;

  const tsType = decl
    ? checker.getTypeOfSymbolAtLocation(sym, decl)
    : checker.getDeclaredTypeOfSymbol(sym);

  const kind = classifyType(tsType, checker);
  const docComment = ts.displayPartsToString(sym.getDocumentationComment(checker)) || undefined;

  const out: PropSchema = { name, type: kind, required };
  if (hasDefault) out.defaultValue = defaults.get(name)!;
  if (docComment) out.docComment = docComment;
  return out;
}

function classifyType(type: ts.Type, checker: ts.TypeChecker): PropKind {
  const nonNull = stripUndefined(type, checker);

  if (nonNull.flags & ts.TypeFlags.String) return { kind: "string" };
  if (nonNull.flags & ts.TypeFlags.Number) return { kind: "number" };
  if (nonNull.flags & ts.TypeFlags.Boolean) return { kind: "boolean" };
  if (nonNull.flags & ts.TypeFlags.BooleanLiteral) return { kind: "boolean" };

  if (nonNull.isUnion()) {
    // A `boolean` type can manifest as a union of `true | false` literals.
    if (
      nonNull.types.length === 2 &&
      nonNull.types.every((t) => !!(t.flags & ts.TypeFlags.BooleanLiteral))
    ) {
      return { kind: "boolean" };
    }

    const values: (string | number)[] = [];
    let allLiterals = true;
    for (const t of nonNull.types) {
      if (t.isStringLiteral()) values.push(t.value);
      else if (t.isNumberLiteral()) values.push(t.value);
      else {
        allLiterals = false;
        break;
      }
    }
    if (allLiterals && values.length > 0) return { kind: "enum", values };
  }

  return {
    kind: "unsupported",
    reason: checker.typeToString(nonNull),
  };
}

function stripUndefined(type: ts.Type, checker: ts.TypeChecker): ts.Type {
  // Use TypeScript's built-in non-nullable resolution, which collapses
  // `T | undefined | null` back to `T` (including normalizing `true | false`
  // back to `boolean`).
  const nonNullable = checker.getNonNullableType(type);
  if (nonNullable !== type) return nonNullable;
  if (!type.isUnion()) return type;
  const filtered = type.types.filter((t) => !(t.flags & ts.TypeFlags.Undefined));
  if (filtered.length === type.types.length) return type;
  if (filtered.length === 1) return filtered[0]!;
  return type;
}
