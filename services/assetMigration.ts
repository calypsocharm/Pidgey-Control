
const BACKEND_API = 'https://backend-api-600206000330.us-west1.run.app';

export const migrateAssets = async (onLog: (msg: string) => void) => {
  onLog("🚀 Initializing Cloud Migration Agent...");
  onLog(`🔗 Connecting to Control Tower Backend: ${BACKEND_API}`);

  try {
      const response = await fetch(`${BACKEND_API}/admin/migrate-assets`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          }
      });

      if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
          const json = await response.json();
          onLog(`✅ Migration Complete: ${JSON.stringify(json)}`);
          return;
      }

      onLog("📡 Receiving stream from server...");
      
      let buffer = '';
      while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // Process all complete lines
          buffer = lines.pop() || ''; // Keep the last partial line in buffer
          
          for (const line of lines) {
              if (line.trim()) {
                  // Clean up JSON strings if needed or just log raw
                  try {
                      // Some streams send "data: ..." format
                      const clean = line.replace(/^data: /, '').trim();
                      if (clean) onLog(clean);
                  } catch (e) {
                      onLog(line);
                  }
              }
          }
      }
      
      if (buffer.trim()) onLog(buffer.trim());
      
      onLog("🏁 Cloud Migration Sequence Finished.");

  } catch (e: any) {
      console.error("Migration Error:", e);
      onLog(`❌ Critical Failure: ${e.message}`);
      onLog("Please check backend logs or system health.");
  }
};
