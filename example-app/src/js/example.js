import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { StripeTerminal } from '@capgo/capacitor-stripe-terminal';

const tokenUrlInput = document.getElementById('tokenUrl');
const initializeButton = document.getElementById('initializeButton');
const discoverOptionsInput = document.getElementById('discoverOptions');
const discoverButton = document.getElementById('discoverButton');
const cancelDiscoverButton = document.getElementById('cancelDiscoverButton');
const statusLine = document.getElementById('statusLine');
const outputLog = document.getElementById('outputLog');

const setStatus = (message) => {
  if (statusLine) statusLine.textContent = `Status: ${message}`;
};

const logResult = (data) => {
  if (outputLog) outputLog.textContent = JSON.stringify(data, null, 2);
};

const parseJsonInput = (inputElement, label) => {
  const raw = inputElement?.value?.trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${label} JSON invalid: ${message}`);
  }
};

const listeners = [];

initializeButton?.addEventListener('click', async () => {
  try {
    setStatus('Initializing terminal...');
    const tokenUrl = tokenUrlInput?.value?.trim();
    if (!tokenUrl) throw new Error('Connection token endpoint is required.');

    await StripeTerminal.initialize({
      tokenProviderEndpoint: tokenUrl,
      isTest: true,
    });

    listeners.push(
      await StripeTerminal.addListener('terminalDiscoveredReaders', (event) => {
        logResult({ event: 'terminalDiscoveredReaders', readers: event.readers });
      }),
    );

    setStatus('Terminal initialized');
    logResult({ initialized: true, tokenUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`Initialize failed: ${message}`);
    logResult({ error: message });
  }
});

discoverButton?.addEventListener('click', async () => {
  try {
    setStatus('Discovering readers...');
    const options = parseJsonInput(discoverOptionsInput, 'Discover readers');
    const result = await StripeTerminal.discoverReaders(options);
    setStatus('Discovery started');
    logResult({ phase: 'discoverReaders', result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`Discover failed: ${message}`);
    logResult({ error: message });
  }
});

cancelDiscoverButton?.addEventListener('click', async () => {
  try {
    setStatus('Canceling discovery...');
    await StripeTerminal.cancelDiscoverReaders();
    setStatus('Discovery canceled');
    logResult({ phase: 'cancelDiscoverReaders' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`Cancel failed: ${message}`);
    logResult({ error: message });
  }
});

if (Capacitor.isNativePlatform()) {
  CapacitorUpdater.notifyAppReady().catch((error) => {
    console.error('Capgo notifyAppReady failed', error);
  });
}
