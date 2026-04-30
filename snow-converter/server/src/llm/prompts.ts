// Prompt templates for each phase of the analysis pipeline

export const EXTRACT_STRUCTURES_SYSTEM = `You are a code analysis expert. You extract structured data from source code files.
Always respond with valid JSON matching the requested schema. Do not include markdown code fences.`;

export function extractStructuresPrompt(files: { path: string; content: string }[]): string {
  const fileList = files
    .map((f) => `=== ${f.path} ===\n${f.content}`)
    .join('\n\n');

  return `Analyze these source files and extract structured information.

For each file, identify:
- Data models/schemas: table names, field names, field types, relationships, constraints
- API endpoints: HTTP method, path, request/response shape
- Business logic: validation rules, triggers, computed fields, event handlers
- UI components: form fields, lists, navigation elements

Return JSON in this exact format:
{
  "models": [
    {
      "sourcePath": "path/to/file.ts",
      "name": "ModelName",
      "fields": [
        { "name": "fieldName", "type": "string|number|boolean|date|reference|choice", "options": {} }
      ],
      "relationships": [
        { "type": "belongsTo|hasMany", "target": "OtherModel", "foreignKey": "field_name" }
      ]
    }
  ],
  "endpoints": [
    {
      "sourcePath": "path/to/file.ts",
      "method": "GET|POST|PUT|DELETE",
      "path": "/api/resource",
      "description": "What it does"
    }
  ],
  "businessLogic": [
    {
      "sourcePath": "path/to/file.ts",
      "name": "functionOrClassName",
      "trigger": "before_insert|after_update|manual|scheduled",
      "description": "What the logic does",
      "table": "related_table_if_any"
    }
  ],
  "uiComponents": [
    {
      "sourcePath": "path/to/file.tsx",
      "name": "ComponentName",
      "type": "form|list|page|widget",
      "fields": ["field1", "field2"]
    }
  ]
}

Files to analyze:

${fileList}`;
}

export const GENERATE_SERVICENOW_SYSTEM = `You are a ServiceNow SDK expert. You generate code using the @servicenow/sdk Fluent API v4.4.0.

Key imports and patterns:
- Tables: import { Table, StringColumn, IntegerColumn, BooleanColumn, DateTimeColumn, ReferenceColumn, ChoiceColumn } from '@servicenow/sdk/core'
- Business Rules: import { BusinessRule } from '@servicenow/sdk/core'
- Script Includes: import { ScriptInclude } from '@servicenow/sdk/core'
- REST APIs: import { RestApi } from '@servicenow/sdk/core'
- Server scripts use: import { gs, GlideRecord } from '@servicenow/glide'

Table example:
export const x_app_tablename = Table({
    name: 'x_app_tablename',
    label: 'Table Label',
    schema: {
        field_name: StringColumn({ label: 'Field Label', mandatory: true }),
        status: ChoiceColumn({
            label: 'Status',
            choices: { active: { label: 'Active' }, inactive: { label: 'Inactive' } }
        }),
        ref_field: ReferenceColumn({ label: 'Reference', referenceTable: 'x_app_other' }),
    },
})

Business Rule example:
import { onSomeEvent } from '../server/module-name'
BusinessRule({
    $id: Now.ID['br_name'],
    name: 'Rule Name',
    active: true,
    table: 'x_app_tablename',
    when: 'before',
    insert: true,
    script: onSomeEvent,
})

Server module example:
import { gs, GlideRecord } from '@servicenow/glide'
export function onSomeEvent(current: GlideRecord) {
    const value = current.getValue('field_name')
    gs.info('Processing: ' + value)
}

Always respond with valid JSON. Do not include markdown code fences.`;

export function generateServiceNowCodePrompt(
  detection: unknown,
  category: string,
  scope: string
): string {
  return `Convert this detected ${category.toLowerCase()} into ServiceNow SDK Fluent API code.

App scope: ${scope}

Detection data:
${JSON.stringify(detection, null, 2)}

Return JSON:
{
  "targetName": "descriptive name for the artifact",
  "targetCode": "the complete .now.ts or .ts file content",
  "confidence": 0.0-1.0,
  "explanation": "brief explanation of the conversion"
}`;
}
