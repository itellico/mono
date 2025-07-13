/**
 * Simple Worker State Management
 * Uses file system instead of database to avoid connection conflicts
 */

import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';

const STATE_FILE_PATH = path.join(process.cwd(), 'temp', 'worker-state.json');

interface WorkerState {
  isManuallyStoppedByUser: boolean;
  lastAction: 'start' | 'stop' | 'restart' | 'auto-start';
  lastActionAt: string;
}

/**
 * Ensure temp directory exists
 */
async function ensureTempDir(): Promise<void> {
  const tempDir = path.dirname(STATE_FILE_PATH);
  try {
    await fs.access(tempDir);
  } catch {
    await fs.mkdir(tempDir, { recursive: true });
  }
}

/**
 * Get current worker state
 */
export async function getWorkerState(): Promise<WorkerState> {
  try {
    await ensureTempDir();
    const data = await fs.readFile(STATE_FILE_PATH, 'utf-8');
    const state = JSON.parse(data) as WorkerState;

    return {
      isManuallyStoppedByUser: state.isManuallyStoppedByUser || false,
      lastAction: state.lastAction || 'auto-start',
      lastActionAt: state.lastActionAt || new Date().toISOString()
    };
  } catch (error) {
    // Default state: allow auto-start
    return {
      isManuallyStoppedByUser: false,
      lastAction: 'auto-start',
      lastActionAt: new Date().toISOString()
    };
  }
}

/**
 * Set worker state
 */
export async function setWorkerState(
  isManuallyStoppedByUser: boolean,
  lastAction: 'start' | 'stop' | 'restart' | 'auto-start'
): Promise<void> {
  try {
    await ensureTempDir();

    const state: WorkerState = {
      isManuallyStoppedByUser,
      lastAction,
      lastActionAt: new Date().toISOString()
    };

    await fs.writeFile(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');

    logger.info('Worker state updated', { 
      isManuallyStoppedByUser, 
      lastAction,
      stateFile: STATE_FILE_PATH
    });
  } catch (error) {
    logger.error('Failed to set worker state', { error });
  }
}

/**
 * Check if workers should auto-start
 */
export async function shouldAutoStart(): Promise<boolean> {
  const state = await getWorkerState();
  return !state.isManuallyStoppedByUser;
} 