'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { StopCircle } from 'lucide-react';
import { WorkflowNodeData } from '../types/workflow';

interface EndNodeProps {
  data: WorkflowNodeData;
  selected?: boolean;
}

export function EndNode({ data, selected }: EndNodeProps) {
  return (
    <div className={`px-3 py-2 shadow-lg rounded-lg bg-gray-50 border-2 w-[140px] transition-all duration-200 ${
      selected ? 'border-blue-500 shadow-xl scale-105' : 'border-gray-500'
    }`}>
      {/* Top input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-in"
        className="w-4 h-4 !bg-gray-500 border-2 border-white shadow-lg hover:scale-125 transition-transform"
        style={{ top: -8 }}
      />
      
      {/* Left input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-in"
        className="w-4 h-4 !bg-gray-500 border-2 border-white shadow-lg hover:scale-125 transition-transform"
        style={{ left: -8 }}
      />
      
      {/* Right input handle */}
      <Handle
        type="target"
        position={Position.Right}
        id="right-in"
        className="w-4 h-4 !bg-gray-500 border-2 border-white shadow-lg hover:scale-125 transition-transform"
        style={{ right: -8 }}
      />
      
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-500 rounded-lg text-white">
          <StopCircle className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-gray-800">{data.label}</div>
          {data.description && (
            <div className="text-xs text-gray-600 mt-1">{data.description}</div>
          )}
        </div>
      </div>
    </div>
  );
} 