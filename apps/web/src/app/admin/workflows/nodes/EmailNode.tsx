'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Mail } from 'lucide-react';
import { WorkflowNodeData } from '../types/workflow';

interface EmailNodeProps {
  data: WorkflowNodeData;
  selected?: boolean;
}

export function EmailNode({ data, selected }: EmailNodeProps) {
  return (
    <div className={`px-3 py-2 shadow-lg rounded-lg bg-purple-50 border-2 w-[140px] transition-all duration-200 ${
      selected ? 'border-blue-500 shadow-xl scale-105' : 'border-purple-500'
    }`}>
      {/* Top input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-in"
        className="w-4 h-4 !bg-purple-500 border-2 border-white shadow-lg hover:scale-125 transition-transform"
        style={{ top: -8 }}
      />
      
      {/* Left input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-in"
        className="w-4 h-4 !bg-purple-500 border-2 border-white shadow-lg hover:scale-125 transition-transform"
        style={{ left: -8 }}
      />
      
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-500 rounded-lg text-white">
          <Mail className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-purple-800">{data.label}</div>
          {data.description && (
            <div className="text-xs text-purple-600 mt-1">{data.description}</div>
          )}
        </div>
      </div>
      
      {/* Right output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="right-out"
        className="w-4 h-4 !bg-purple-500 border-2 border-white shadow-lg hover:scale-125 transition-transform"
        style={{ right: -8 }}
      />
      
      {/* Bottom output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-out"
        className="w-4 h-4 !bg-purple-500 border-2 border-white shadow-lg hover:scale-125 transition-transform"
        style={{ bottom: -8 }}
      />
    </div>
  );
} 