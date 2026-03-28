import matter from "gray-matter";

export interface ParsedFile {
  data: Record<string, unknown>;
  body: string;
}

export function parseFrontmatter(content: string): ParsedFile {
  const { data, content: body } = matter(content);
  return { data, body: body.trim() };
}

export function stringifyFrontmatter(data: Record<string, unknown>, body: string): string {
  return matter.stringify(body, data);
}
