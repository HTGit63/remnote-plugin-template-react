import { usePlugin, renderWidget, useTracker, type Rem } from '@remnote/plugin-sdk';
import React, { useState, useEffect } from 'react';
import { AI_ACTIONS, callOpenAI, DEFAULT_OPENAI_MODEL } from '../services/openai';

export const ConnectorWidget = () => {
  const plugin = usePlugin();

  useEffect(() => {
    console.log('ConnectorWidget: Mounted successfully.');
  }, []);

  const [topic, setTopic] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugLogs, setDebugLogs] = useState<string[]>(['Widget Initialized']);

  const addDebug = (msg: string) => {
    console.log(`[Connector Debug] ${msg}`);
    setDebugLogs((prev) => [...prev.slice(-7), msg]);
  };

  const apiKey = useTracker(async (reactivePlugin) => {
    try {
      const key = await reactivePlugin.settings.getSetting<string>('openai-api-key');
      const finalKey = (key || '').trim();
      console.log(`ConnectorWidget: Loaded setting openai-api-key: ${finalKey ? 'Set' : 'Empty'}`);
      return finalKey;
    } catch (e: unknown) {
      console.error('ConnectorWidget: Error loading API key:', e);
      return '';
    }
  });

  const model = useTracker(async (reactivePlugin) => {
    try {
      const configuredModel = await reactivePlugin.settings.getSetting<string>('openai-model');
      return (configuredModel || DEFAULT_OPENAI_MODEL).trim();
    } catch (e: unknown) {
      console.error('ConnectorWidget: Error loading model:', e);
      return DEFAULT_OPENAI_MODEL;
    }
  });

  const focusedRem = useTracker(async (reactivePlugin) => {
    try {
      const rem = await reactivePlugin.focus.getFocusedRem();
      console.log('ConnectorWidget: Retrieved focusedRem.');
      return rem;
    } catch (e: unknown) {
      console.error('ConnectorWidget: Error tracking focusedRem:', e);
      return undefined;
    }
  });

  const latestDebugLog = debugLogs[debugLogs.length - 1] ?? 'Ready';

  const getCurrentFocusedRem = async (): Promise<Rem | undefined> => {
    if (!focusedRem?._id) {
      return undefined;
    }

    // Re-fetch so actions use the latest Rem text instead of a stale tracked snapshot.
    return (await plugin.rem.findOne(focusedRem._id)) ?? focusedRem;
  };

  const getRemContent = async (rem: Rem): Promise<string> => {
    const segments: string[] = [];
    const frontText = await plugin.richText.toString(rem.text ?? []);
    if (frontText.trim()) {
      segments.push(frontText.trim());
    }

    if (rem.backText?.length) {
      const backText = await plugin.richText.toString(rem.backText);
      if (backText.trim()) {
        segments.push(`Details:\n${backText.trim()}`);
      }
    }

    return segments.join('\n\n').trim();
  };

  const buildChatGPTPrompt = async (): Promise<string> => {
    if (aiOutput.trim()) {
      return `Help me continue working on these RemNote notes.\n\n${aiOutput.trim()}`;
    }

    const targetRem = await getCurrentFocusedRem();
    if (targetRem) {
      const content = await getRemContent(targetRem);
      if (content) {
        return `Help me improve these RemNote notes.\n\n${content}`;
      }
    }

    if (topic.trim()) {
      return `Help me create structured RemNote notes about:\n\n${topic.trim()}`;
    }

    return 'Help me work with my RemNote notes.';
  };

  const handleOpenChatGPT = async () => {
    try {
      const prompt = await buildChatGPTPrompt();
      await navigator.clipboard.writeText(prompt);
      window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer');
      plugin.app.toast('Opened ChatGPT and copied prompt. Paste into chat.');
      addDebug('Opened ChatGPT handoff.');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(`Failed to open ChatGPT: ${message}`);
    }
  };

  const handleAIAction = async (actionType: keyof typeof AI_ACTIONS) => {
    setError('');
    if (!apiKey) {
      setError('Please set the OpenAI API Key in RemNote plugin settings.');
      return;
    }

    setLoading(true);
    setAiOutput('');
    addDebug(`Starting action: ${actionType}`);

    try {
      let prompt = '';
      if (actionType === 'generate') {
        if (!topic) throw new Error('Please enter a topic to generate notes.');
        prompt = AI_ACTIONS.generate(topic);
      } else {
        const targetRem = await getCurrentFocusedRem();
        if (!targetRem) throw new Error('Please focus or zoom into a Rem first to perform this action.');
        addDebug('Fetching text from focused Rem...');

        const contentStr = await getRemContent(targetRem);
        if (!contentStr) throw new Error('The focused Rem has no readable content.');

        prompt = AI_ACTIONS[actionType](contentStr);
      }

      addDebug(`Calling OpenAI API with ${model || DEFAULT_OPENAI_MODEL}...`);
      const result = await callOpenAI({
        apiKey,
        prompt,
        model,
      });
      addDebug('OpenAI replied successfully.');
      setAiOutput(result);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('ConnectorWidget Action Error:', e);
      setError(message);
      addDebug(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const createRemFromMarkdown = async (markdown: string, parent?: Rem) => {
    const createdRem = await plugin.rem.createWithMarkdown(markdown);
    if (!createdRem) {
      throw new Error('RemNote did not return a new Rem.');
    }

    if (parent) {
      await createdRem.setParent(parent, 0);
    }

    return createdRem;
  };

  const handleCreateTopLevel = async () => {
    if (!aiOutput) return;
    try {
      await createRemFromMarkdown(aiOutput);
      plugin.app.toast('Created new Rem from AI output.');
      addDebug('Created top-level Rem.');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(`Failed to create Rem: ${message}`);
    }
  };

  const handleAppend = async () => {
    if (!focusedRem || !aiOutput) return;
    try {
      const targetRem = await getCurrentFocusedRem();
      if (!targetRem) {
        throw new Error('No focused Rem available.');
      }

      await createRemFromMarkdown(aiOutput, targetRem);
      plugin.app.toast('Appended AI output as a child.');
      addDebug('Appended as child.');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(`Failed to append: ${message}`);
    }
  };

  const handleReplace = async () => {
    if (!focusedRem || !aiOutput) return;
    const confirm = window.confirm(
      'Safety Check: Are you sure you want to completely replace the content of this Rem? This is destructive.'
    );
    if (!confirm) return;

    try {
      const targetRem = await getCurrentFocusedRem();
      if (!targetRem) {
        throw new Error('No focused Rem available.');
      }

      const richText = await plugin.richText.parseFromMarkdown(aiOutput);
      await targetRem.setText(richText);
      plugin.app.toast('Replaced Rem content.');
      addDebug('Replaced Rem content.');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(`Failed to replace: ${message}`);
    }
  };

  const handleDelete = async () => {
    if (!focusedRem) return;
    const confirm = window.confirm(
      'Safety Check: Are you sure you want to DELETE this Rem and all descendants? This is extremely destructive.'
    );
    if (!confirm) return;

    try {
      const targetRem = await getCurrentFocusedRem();
      if (!targetRem) {
        throw new Error('No focused Rem available.');
      }

      await targetRem.remove();
      plugin.app.toast('Rem deleted.');
      setAiOutput('');
      addDebug('Deleted focused Rem.');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(`Failed to delete: ${message}`);
    }
  };

  return (
    <div
      className="p-4 bg-white dark:bg-gray-900 border rn-clr-background-light-positive rn-clr-content-positive shadow-sm h-full w-full overflow-y-auto"
      style={{ fontFamily: 'var(--font-primary, sans-serif)', minHeight: '300px' }}
    >
      <h2 className="text-xl font-bold mb-2">RemNote OpenAI Connector</h2>
      <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 p-2 rounded text-xs mb-4">
        ✅ Widget Loaded Successfully
        <div className="mt-1 font-mono">Logs: {latestDebugLog}</div>
      </div>

      <div className="mb-4 p-3 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded">
        <h3 className="font-semibold border-b pb-1 mb-2">System Diagnostics</h3>
        <ul className="text-sm space-y-1">
          <li>
            <strong>API Key: </strong>
            {apiKey ? <span className="text-green-600">Configured</span> : <span className="text-red-500 font-bold">Missing</span>}
          </li>
          <li>
            <strong>Model: </strong>
            <span className="text-green-600">{model || DEFAULT_OPENAI_MODEL}</span>
          </li>
          <li>
            <strong>Context Target: </strong>
            {focusedRem ? <span className="text-green-600">Rem Focus Found</span> : <span className="text-gray-500 italic">No Rem focused</span>}
          </li>
        </ul>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleOpenChatGPT}
            className="bg-black text-white px-3 py-2 rounded font-bold hover:opacity-90 text-sm"
          >
            Open ChatGPT
          </button>
        </div>
      </div>

      {!apiKey && (
        <div className="p-2 mb-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 rounded text-sm text-yellow-800 dark:text-yellow-100">
          ⚠️ Please click the gear icon to open RemNote settings, find "RemNote OpenAI Connector", and add your OpenAI API Key.
        </div>
      )}

      <div className="mb-4">
        <label className="block mb-1 font-semibold text-sm">Generate Topic from Scratch:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. History of Rome"
            className="flex-1 border p-2 rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
          />
          <button
            onClick={() => handleAIAction('generate')}
            disabled={loading}
            className="bg-blue-500 text-white px-3 py-2 rounded font-bold hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            {loading ? '...' : 'Generate Notes'}
          </button>
        </div>
      </div>

      <div className="mb-4 border-t pt-4">
        <label className="block mb-2 font-semibold text-sm">Actions on Focused Rem:</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleAIAction('summarize')}
            disabled={loading || !focusedRem}
            className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Summarize
          </button>
          <button
            onClick={() => handleAIAction('rewrite')}
            disabled={loading || !focusedRem}
            className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Rewrite
          </button>
          <button
            onClick={() => handleAIAction('expand')}
            disabled={loading || !focusedRem}
            className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Expand
          </button>
          <button
            onClick={() => handleAIAction('clean')}
            disabled={loading || !focusedRem}
            className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Clean Format
          </button>
        </div>
        {!focusedRem && <div className="text-xs text-gray-500 mt-2">Click into any Rem note to enable context actions.</div>}
      </div>

      {error && <div className="text-red-500 font-semibold mb-4 p-2 bg-red-100 dark:bg-red-900 border border-red-300 rounded text-sm">{error}</div>}

      {aiOutput && (
        <div className="mb-4 border-t pt-4">
          <h3 className="font-bold mb-2 text-sm text-green-700 dark:text-green-400">AI Preview Ready:</h3>
          <div className="p-3 border border-green-300 rounded mb-3 bg-white dark:bg-gray-900 whitespace-pre-wrap text-sm max-h-48 overflow-y-auto">
            {aiOutput}
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreateTopLevel} className="flex-1 bg-blue-500 text-white px-3 py-2 rounded font-bold hover:bg-blue-600 text-sm">
              Create New Rem
            </button>
            <button onClick={handleAppend} disabled={!focusedRem} className="flex-1 bg-green-500 text-white px-3 py-2 rounded font-bold hover:bg-green-600 disabled:opacity-50 text-sm">
              Append as Child
            </button>
            <button onClick={handleReplace} disabled={!focusedRem} className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded font-bold hover:bg-yellow-600 disabled:opacity-50 text-sm">
              Replace Over
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 border-t pt-4">
        <button
          onClick={handleDelete}
          disabled={!focusedRem}
          className="w-full bg-red-100 text-red-600 outline outline-1 outline-red-300 px-4 py-2 rounded font-bold hover:bg-red-200 disabled:opacity-50 text-sm"
        >
          Delete Focused Rem
        </button>
      </div>
    </div>
  );
};

renderWidget(ConnectorWidget);
