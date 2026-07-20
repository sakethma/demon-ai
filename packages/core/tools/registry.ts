type Platform = 'desktop' | 'mobile' | 'shared';

export interface DemonTool {
  name: string;
  description: string;
  platform: Platform;
  parameters: any; // Using any for schema simplification here
}

export const ALL_TOOLS: DemonTool[] = [
  // Shared Tools
  {
    name: 'chat',
    description: 'General conversational response',
    platform: 'shared',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'web_search',
    description: 'Search the web for information',
    platform: 'shared',
    parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }
  },

  // Desktop Tools
  {
    name: 'set_volume',
    description: 'Set system volume level on Desktop',
    platform: 'desktop',
    parameters: { type: 'object', properties: { level: { type: 'number' } }, required: ['level'] }
  },
  {
    name: 'shutdown_pc',
    description: 'Shutdown the desktop PC',
    platform: 'desktop',
    parameters: { type: 'object', properties: {} }
  },

  // Mobile Tools
  {
    name: 'send_push_notification',
    description: 'Send a background push notification',
    platform: 'mobile',
    parameters: { type: 'object', properties: { title: { type: 'string' }, body: { type: 'string' } }, required: ['title', 'body'] }
  },
  {
    name: 'capture_camera_photo',
    description: 'Capture a photo from the device camera',
    platform: 'mobile',
    parameters: { type: 'object', properties: {} }
  }
];

export function getToolsForPlatform(currentPlatform: 'desktop' | 'mobile'): DemonTool[] {
  return ALL_TOOLS.filter(
    (tool) => tool.platform === 'shared' || tool.platform === currentPlatform
  );
}
