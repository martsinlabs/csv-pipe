<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useData } from 'vitepress';
// The real library, bundled into the page. Nothing is mocked or sent anywhere.
import { parse, stringify, type CsvParseOptions } from '../../../src/index';
import { downloadCsv } from '../../../src/platform/browser';

const { isDark } = useData();
const mode = ref<'encode' | 'parse'>('encode');

// Encode state
const jsonInput = ref(`[
  { "name": "Alex Johnson", "email": "alex@example.com", "age": 29 },
  { "name": "Carlos Herrera", "email": "carlos@example.com", "age": 24 }
]`);
const separator = ref(',');
const quoting = ref<'minimal' | 'all' | 'non-numeric'>('minimal');
const sanitizeFormulas = ref(false);

// Parse state
const csvInput = ref(`name,email,age
Alex Johnson,alex@example.com,29
Carlos Herrera,carlos@example.com,24`);
const header = ref(true);
const dynamicTyping = ref(false);
const parseSep = ref('auto');

// One-shot copy with brief feedback. Only ever runs from a click.
const copied = ref('');
function copy(text: string, key: string) {
  navigator.clipboard?.writeText(text);
  copied.value = key;
  setTimeout(() => {
    if (copied.value === key) copied.value = '';
  }, 1200);
}

const encodePresets: Record<string, string> = {
  Users: jsonInput.value,
  'Formula risk': `[
  { "name": "=1+1", "note": "attacker input" },
  { "name": "Alex Johnson", "note": "safe value" }
]`,
  Quoted: `[
  { "name": "Smith, John", "quote": "He said \\"hi\\"" }
]`
};
const parsePresets: Record<string, string> = {
  Users: csvInput.value,
  'Quote-heavy': `name,note
"Smith, John","He said ""hi"""`,
  Semicolon: `a;b;c
1;2;3`
};
const presetNames = computed(() =>
  Object.keys(mode.value === 'encode' ? encodePresets : parsePresets)
);
function loadPreset(name: string) {
  if (mode.value === 'encode') jsonInput.value = encodePresets[name]!;
  else csvInput.value = parsePresets[name]!;
}

type Result = { value?: string; count?: number; error?: string };

const encodeResult = computed<Result>(() => {
  let data: unknown;
  try {
    data = JSON.parse(jsonInput.value);
  } catch (error) {
    return { error: `Invalid JSON: ${(error as Error).message}` };
  }
  if (!Array.isArray(data)) {
    return { error: 'Input must be a JSON array of objects.' };
  }
  try {
    return {
      value: stringify(data as object[], {
        separator: separator.value,
        quoting: quoting.value,
        sanitizeFormulas: sanitizeFormulas.value
      }),
      count: data.length
    };
  } catch (error) {
    return { error: (error as Error).message };
  }
});

const parseResult = computed<Result>(() => {
  try {
    const options: CsvParseOptions = {
      header: header.value,
      dynamicTyping: dynamicTyping.value,
      separator: parseSep.value === 'auto' ? 'auto' : parseSep.value
    };
    const records = parse(csvInput.value, options);
    return { value: JSON.stringify(records, null, 2), count: records.length };
  } catch (error) {
    return { error: (error as Error).message };
  }
});

const result = computed(() =>
  mode.value === 'encode' ? encodeResult.value : parseResult.value
);

// The exact call that produced the output, with only the non-default options.
const code = computed(() => {
  if (mode.value === 'encode') {
    const parts: string[] = [];
    if (separator.value !== ',')
      parts.push(`separator: ${JSON.stringify(separator.value)}`);
    if (quoting.value !== 'minimal') parts.push(`quoting: '${quoting.value}'`);
    if (sanitizeFormulas.value) parts.push('sanitizeFormulas: true');
    const opts = parts.length ? `, { ${parts.join(', ')} }` : '';
    return `import { stringify } from 'csv-pipe';\n\nstringify(data${opts});`;
  }
  const parts: string[] = [];
  if (!header.value) parts.push('header: false');
  if (dynamicTyping.value) parts.push('dynamicTyping: true');
  if (parseSep.value !== ',')
    parts.push(`separator: ${JSON.stringify(parseSep.value)}`);
  const opts = parts.length ? `, { ${parts.join(', ')} }` : '';
  return `import { parse } from 'csv-pipe';\n\nparse(text${opts});`;
});

// Highlight the generated code with the same Shiki themes the docs use. Only
// TypeScript and the two github themes load, lazily on the client, so the page
// is never blocked and nothing runs during SSR.
const highlighted = ref('');
let highlighterPromise: Promise<any> | undefined;
function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] =
        await Promise.all([
          import('shiki/core'),
          import('shiki/engine/javascript')
        ]);
      return createHighlighterCore({
        themes: [
          import('shiki/themes/github-light.mjs'),
          import('shiki/themes/github-dark.mjs')
        ],
        langs: [import('shiki/langs/typescript.mjs')],
        engine: createJavaScriptRegexEngine()
      });
    })();
  }
  return highlighterPromise;
}
async function highlight() {
  try {
    const hl = await getHighlighter();
    highlighted.value = hl.codeToHtml(code.value, {
      lang: 'typescript',
      theme: isDark.value ? 'github-dark' : 'github-light'
    });
  } catch {
    highlighted.value = '';
  }
}
onMounted(highlight);
watch([code, isDark], highlight);

function downloadResult() {
  try {
    const data = JSON.parse(jsonInput.value);
    if (Array.isArray(data)) {
      downloadCsv(data, {
        filename: 'data.csv',
        separator: separator.value,
        quoting: quoting.value,
        sanitizeFormulas: sanitizeFormulas.value
      });
    }
  } catch {
    // Invalid JSON: the output pane already shows the error.
  }
}
async function uploadCsv(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) csvInput.value = await file.text();
}

// Shareable link: the full state lives in the URL hash.
function shareLink() {
  const state =
    mode.value === 'encode'
      ? {
          m: 'e',
          i: jsonInput.value,
          s: separator.value,
          q: quoting.value,
          f: sanitizeFormulas.value
        }
      : {
          m: 'p',
          i: csvInput.value,
          h: header.value,
          d: dynamicTyping.value,
          s: parseSep.value
        };
  const hash = btoa(encodeURIComponent(JSON.stringify(state)));
  copy(`${location.origin}${location.pathname}#${hash}`, 'link');
}
onMounted(() => {
  if (!location.hash) return;
  try {
    const s = JSON.parse(decodeURIComponent(atob(location.hash.slice(1))));
    if (s.m === 'e') {
      mode.value = 'encode';
      jsonInput.value = s.i;
      separator.value = s.s;
      quoting.value = s.q;
      sanitizeFormulas.value = s.f;
    } else if (s.m === 'p') {
      mode.value = 'parse';
      csvInput.value = s.i;
      header.value = s.h;
      dynamicTyping.value = s.d;
      parseSep.value = s.s;
    }
  } catch {
    // Ignore a malformed link and keep the defaults.
  }
});
</script>

<template>
  <div class="pg">
    <div class="pg-top">
      <div class="pg-tabs">
        <button :class="{ on: mode === 'encode' }" @click="mode = 'encode'">
          Encode
        </button>
        <button :class="{ on: mode === 'parse' }" @click="mode = 'parse'">
          Parse
        </button>
      </div>
      <button class="pg-link" @click="shareLink">
        {{ copied === 'link' ? 'Link copied' : 'Copy link' }}
      </button>
    </div>

    <div class="pg-presets">
      <span class="pg-presets-label">Examples</span>
      <button v-for="name in presetNames" :key="name" @click="loadPreset(name)">
        {{ name }}
      </button>
    </div>

    <div class="pg-grid">
      <div class="pg-pane">
        <div class="pg-head">
          <span class="pg-label">{{
            mode === 'encode' ? 'Input (JSON)' : 'Input (CSV)'
          }}</span>
        </div>
        <textarea
          v-if="mode === 'encode'"
          v-model="jsonInput"
          spellcheck="false"
        ></textarea>
        <textarea v-else v-model="csvInput" spellcheck="false"></textarea>

        <div v-if="mode === 'encode'" class="pg-opts">
          <label
            >Separator <input v-model="separator" maxlength="1" class="pg-sep"
          /></label>
          <label
            >Quoting
            <select v-model="quoting">
              <option value="minimal">minimal</option>
              <option value="all">all</option>
              <option value="non-numeric">non-numeric</option>
            </select>
          </label>
          <label class="pg-check">
            <input type="checkbox" v-model="sanitizeFormulas" />
            sanitizeFormulas
          </label>
          <button class="pg-action" @click="downloadResult">
            Download .csv
          </button>
        </div>

        <div v-else class="pg-opts">
          <label
            >Separator
            <select v-model="parseSep">
              <option value="auto">auto</option>
              <option value=",">comma</option>
              <option value=";">semicolon</option>
              <option value="&#9;">tab</option>
            </select>
          </label>
          <label class="pg-check">
            <input type="checkbox" v-model="header" /> header
          </label>
          <label class="pg-check">
            <input type="checkbox" v-model="dynamicTyping" /> dynamicTyping
          </label>
          <label class="pg-upload">
            Upload CSV
            <input type="file" accept=".csv,text/csv" @change="uploadCsv" />
          </label>
        </div>
      </div>

      <div class="pg-pane">
        <div class="pg-head">
          <span class="pg-label">{{
            mode === 'encode' ? 'Output (CSV)' : 'Output (records)'
          }}</span>
          <span v-if="!result.error" class="pg-count"
            >{{ result.count }}
            {{ mode === 'encode' ? 'rows' : 'records' }}</span
          >
          <button
            class="pg-copy"
            :disabled="!!result.error"
            @click="copy(result.value ?? '', 'out')"
          >
            {{ copied === 'out' ? 'Copied' : 'Copy' }}
          </button>
        </div>
        <pre class="pg-out" :class="{ err: result.error }">{{
          result.error || result.value
        }}</pre>
      </div>
    </div>

    <div class="pg-code">
      <div class="pg-head">
        <span class="pg-label">Code</span>
        <button class="pg-copy" @click="copy(code, 'code')">
          {{ copied === 'code' ? 'Copied' : 'Copy' }}
        </button>
      </div>
      <div class="pg-codebox">
        <span class="pg-lang">ts</span>
        <div v-if="highlighted" class="pg-shiki" v-html="highlighted"></div>
        <pre v-else class="pg-plain">{{ code }}</pre>
      </div>
    </div>

    <p class="pg-note">
      Runs the real csv-pipe in your browser. Nothing is uploaded.
    </p>
  </div>
</template>

<style scoped>
.pg {
  margin: 1.5rem 0;
}
.pg-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.pg-tabs {
  display: flex;
  gap: 8px;
}
.pg-tabs button {
  padding: 8px 18px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.pg-tabs button.on {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
}
.pg-link,
.pg-copy,
.pg-action {
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 12px;
}
.pg-copy:disabled {
  opacity: 0.4;
  cursor: default;
}
.pg-action {
  border-color: var(--vp-button-brand-bg);
  background: var(--vp-button-brand-bg);
  color: #fff;
  transition:
    background-color 0.2s,
    border-color 0.2s;
}
.pg-action:hover {
  border-color: var(--vp-button-brand-hover-bg);
  background: var(--vp-button-brand-hover-bg);
}
.pg-presets {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.pg-presets-label {
  font-size: 13px;
  color: var(--vp-c-text-3);
}
.pg-presets button {
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 13px;
  cursor: pointer;
}
.pg-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (max-width: 720px) {
  .pg-grid {
    grid-template-columns: 1fr;
  }
}
.pg-pane {
  display: flex;
  flex-direction: column;
}
.pg-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  min-height: 30px;
}
.pg-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}
.pg-count {
  font-size: 12px;
  color: var(--vp-c-text-3);
  margin-left: auto;
}
.pg-head .pg-copy {
  margin-left: auto;
}
.pg-count + .pg-copy {
  margin-left: 0;
}
.pg textarea,
.pg-out {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.5;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  padding: 12px;
  min-height: 200px;
  white-space: pre;
  overflow: auto;
}
.pg textarea {
  resize: vertical;
  color: var(--vp-c-text-1);
  width: 100%;
  box-sizing: border-box;
}
.pg-out {
  margin: 0;
}
.pg-out.err {
  color: var(--vp-c-danger-1, #e0625f);
}
.pg-opts {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  margin-top: 10px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.pg-opts select,
.pg-sep {
  margin-left: 6px;
  padding: 3px 6px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}
.pg-sep {
  width: 38px;
  text-align: center;
}
.pg-check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.pg-code {
  margin-top: 16px;
}
.pg-codebox {
  position: relative;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-code-block-bg, var(--vp-c-bg-soft));
  padding: 14px 16px;
  overflow: auto;
}
.pg-lang {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 12px;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
}
.pg-plain {
  margin: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre;
  color: var(--vp-c-text-1);
}
.pg-shiki :deep(pre) {
  margin: 0;
  background: transparent !important;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre;
  overflow: auto;
}
.pg-shiki :deep(code) {
  font-family: inherit;
}
.pg-note {
  font-size: 12px;
  color: var(--vp-c-text-3);
  margin-top: 14px;
}
</style>
