# Verification Patterns

How to verify different types of artifacts are real implementations, not stubs or placeholders.

<core_principle>
**Existence ≠ Implementation**

A file existing does not mean the feature works. Verification must check:
1. **Exists** - File is present at expected path
2. **Substantive** - Content is real implementation, not placeholder
3. **Wired** - Connected to the rest of the system
4. **Functional** - Actually works when invoked

Levels 1-3 can be checked programmatically. Level 4 often requires human verification.
</core_principle>

<stub_detection>

## Universal Stub Patterns

These patterns indicate placeholder code regardless of file type:

**Comment-based stubs:**
```bash
# Grep patterns for stub comments
grep -E "(TODO|FIXME|XXX|HACK|PLACEHOLDER)" "$file"
grep -E "implement|add later|coming soon|will be" "$file" -i
grep -E "// \.\.\.|/\* \.\.\. \*/|# \.\.\." "$file"
```

**Placeholder text in output:**
```bash
# UI placeholder patterns
grep -E "placeholder|lorem ipsum|coming soon|under construction" "$file" -i
grep -E "sample|example|test data|dummy" "$file" -i
grep -E "\[.*\]|<.*>|\{.*\}" "$file"  # Template brackets left in
```

**Empty or trivial implementations:**
```bash
# Functions that do nothing
grep -E "return null|return undefined|return \{\}|return \[\]" "$file"
grep -E "pass$|\.\.\.|\bnothing\b" "$file"
grep -E "console\.(log|warn|error).*only" "$file"  # Log-only functions
```

**Hardcoded values where dynamic expected:**
```bash
# Hardcoded IDs, counts, or content
grep -E "id.*=.*['\"].*['\"]" "$file"  # Hardcoded string IDs
grep -E "count.*=.*\d+|length.*=.*\d+" "$file"  # Hardcoded counts
grep -E "\\\$\d+\.\d{2}|\d+ items" "$file"  # Hardcoded display values
```

</stub_detection>

<react_components>

## React/Next.js Components

**Existence check:**
```bash
[ -f "$component_path" ] && grep -E "export (default |)function|export const.*=.*\(" "$component_path"
```

**Substantive check:**
```bash
grep -E "return.*<" "$component_path" | grep -v "return.*null" | grep -v "placeholder" -i
grep -E "<[A-Z][a-zA-Z]+|className=|onClick=|onChange=" "$component_path"
grep -E "props\.|useState|useEffect|useContext|\{.*\}" "$component_path"
```

**Stub patterns specific to React:**
```javascript
// RED FLAGS - These are stubs:
return <div>Component</div>
return <div>Placeholder</div>
return <div>{/* TODO */}</div>
return <p>Coming soon</p>
return null
return <></>

// Also stubs - empty handlers:
onClick={() => {}}
onChange={() => console.log('clicked')}
onSubmit={(e) => e.preventDefault()}  // Only prevents default, does nothing
```

**Wiring check:**
```bash
grep -E "^import.*from" "$component_path"
grep -E "\{ .* \}.*props|\bprops\.[a-zA-Z]+" "$component_path"
grep -E "fetch\(|axios\.|useSWR|useQuery|getServerSideProps|getStaticProps" "$component_path"
```

</react_components>

<api_routes>

## API Routes (Next.js App Router / Express / etc.)

**Existence check:**
```bash
[ -f "$route_path" ]
grep -E "export (async )?(function|const) (GET|POST|PUT|PATCH|DELETE)" "$route_path"
```

**Substantive check:**
```bash
wc -l "$route_path"  # More than 10-15 lines suggests real implementation
grep -E "prisma\.|db\.|mongoose\.|sql|query|find|create|update|delete" "$route_path" -i
grep -E "try|catch|throw|error|Error" "$route_path"
grep -E "Response\.json|res\.json|res\.send|return.*\{" "$route_path" | grep -v "message.*not implemented" -i
```

**Stub patterns specific to API routes:**
```typescript
// RED FLAGS - These are stubs:
export async function POST() {
  return Response.json({ message: "Not implemented" })
}

export async function GET() {
  return Response.json([])  // Empty array with no DB query
}

export async function PUT() {
  return new Response()  // Empty response
}
```

**Wiring check:**
```bash
grep -E "^import.*prisma|^import.*db|^import.*client" "$route_path"
grep -E "req\.json\(\)|req\.body|request\.json\(\)" "$route_path"
grep -E "schema\.parse|validate|zod|yup|joi" "$route_path"
```

</api_routes>

<database_schema>

## Database Schema (Prisma / Drizzle / SQL)

**Existence check:**
```bash
[ -f "prisma/schema.prisma" ] || [ -f "drizzle/schema.ts" ] || [ -f "src/db/schema.sql" ]
grep -E "^model $model_name|CREATE TABLE $table_name|export const $table_name" "$schema_path"
```

**Substantive check:**
```bash
grep -A 20 "model $model_name" "$schema_path" | grep -E "^\s+\w+\s+\w+"
grep -E "@relation|REFERENCES|FOREIGN KEY" "$schema_path"
grep -A 20 "model $model_name" "$schema_path" | grep -E "Int|DateTime|Boolean|Float|Decimal|Json"
```

</database_schema>

<wiring_verification>

## Wiring Verification Patterns

Wiring verification checks that components actually communicate. This is where most stubs hide.

### Pattern: Component → API

```bash
grep -E "fetch\(['\"].*$api_path|axios\.(get|post).*$api_path" "$component_path"
grep -E "fetch\(|axios\." "$component_path" | grep -v "^.*//.*fetch"
grep -E "await.*fetch|\.then\(|setData|setState" "$component_path"
```

### Pattern: API → Database

```bash
grep -E "prisma\.$model|db\.query|Model\.find" "$route_path"
grep -E "await.*prisma|await.*db\." "$route_path"
grep -E "return.*json.*data|res\.json.*result" "$route_path"
```

### Pattern: Form → Handler

```bash
grep -E "onSubmit=\{|handleSubmit" "$component_path"
grep -A 10 "onSubmit.*=" "$component_path" | grep -E "fetch|axios|mutate|dispatch"
```

### Pattern: State → Render

```bash
grep -E "\{.*messages.*\}|\{.*data.*\}|\{.*items.*\}" "$component_path"
grep -E "\.map\(|\.filter\(|\.reduce\(" "$component_path"
```

</wiring_verification>

<verification_checklist>

## Quick Verification Checklist

### Component Checklist
- [ ] File exists at expected path
- [ ] Exports a function/const component
- [ ] Returns JSX (not null/empty)
- [ ] No placeholder text in render
- [ ] Uses props or state (not static)
- [ ] Event handlers have real implementations
- [ ] Imports resolve correctly
- [ ] Used somewhere in the app

### API Route Checklist
- [ ] File exists at expected path
- [ ] Exports HTTP method handlers
- [ ] Handlers have more than 5 lines
- [ ] Queries database or service
- [ ] Returns meaningful response (not empty/placeholder)
- [ ] Has error handling
- [ ] Validates input
- [ ] Called from frontend

### Schema Checklist
- [ ] Model/table defined
- [ ] Has all expected fields
- [ ] Fields have appropriate types
- [ ] Relationships defined if needed
- [ ] Migrations exist and applied
- [ ] Client generated

### Wiring Checklist
- [ ] Component → API: fetch/axios call exists and uses response
- [ ] API → Database: query exists and result returned
- [ ] Form → Handler: onSubmit calls API/mutation
- [ ] State → Render: state variables appear in JSX

</verification_checklist>

<human_verification_triggers>

## When to Require Human Verification

Some things can't be verified programmatically. Flag these for human testing:

**Always human:**
- Visual appearance (does it look right?)
- User flow completion (can you actually do the thing?)
- Real-time behavior (WebSocket, SSE)
- External service integration (Stripe, email sending)
- Error message clarity (is the message helpful?)
- Performance feel (does it feel fast?)

**Format for human verification request:**
```markdown
## Human Verification Required

### 1. Chat message sending
**Test:** Type a message and click Send
**Expected:** Message appears in list, input clears
**Check:** Does message persist after refresh?

### 2. Error handling
**Test:** Disconnect network, try to send
**Expected:** Error message appears, message not lost
**Check:** Can retry after reconnect?
```

</human_verification_triggers>
