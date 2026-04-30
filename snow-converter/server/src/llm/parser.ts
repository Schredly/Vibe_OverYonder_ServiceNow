import { z } from 'zod';

// Schema for extraction phase
const FieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  options: z.record(z.unknown()).optional(),
});

const RelationshipSchema = z.object({
  type: z.enum(['belongsTo', 'hasMany']),
  target: z.string(),
  foreignKey: z.string().optional(),
});

const ModelSchema = z.object({
  sourcePath: z.string(),
  name: z.string(),
  fields: z.array(FieldSchema),
  relationships: z.array(RelationshipSchema).optional(),
});

const EndpointSchema = z.object({
  sourcePath: z.string(),
  method: z.string(),
  path: z.string(),
  description: z.string().optional(),
});

const BusinessLogicSchema = z.object({
  sourcePath: z.string(),
  name: z.string(),
  trigger: z.string().optional(),
  description: z.string().optional(),
  table: z.string().optional(),
});

const UIComponentSchema = z.object({
  sourcePath: z.string(),
  name: z.string(),
  type: z.string().optional(),
  fields: z.array(z.string()).optional(),
});

export const ExtractionResultSchema = z.object({
  models: z.array(ModelSchema).default([]),
  endpoints: z.array(EndpointSchema).default([]),
  businessLogic: z.array(BusinessLogicSchema).default([]),
  uiComponents: z.array(UIComponentSchema).default([]),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// Schema for code generation phase
export const GeneratedCodeSchema = z.object({
  targetName: z.string(),
  targetCode: z.string(),
  confidence: z.number().min(0).max(1),
  explanation: z.string().optional(),
});

export type GeneratedCode = z.infer<typeof GeneratedCodeSchema>;

export function parseJson<T>(text: string, schema: z.ZodType<T>): T | null {
  // Try to extract JSON from the response (might be wrapped in markdown)
  let jsonStr = text.trim();

  // Remove markdown code fences if present
  const fenceMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return schema.parse(parsed);
  } catch {
    // Try to find JSON object in the text
    const objMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        const parsed = JSON.parse(objMatch[0]);
        return schema.parse(parsed);
      } catch {
        return null;
      }
    }
    return null;
  }
}
