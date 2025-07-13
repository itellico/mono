'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WorkflowNodeData } from '../types/workflow';

interface DecisionNodeProps {
  data: WorkflowNodeData;
  selected?: boolean;
}

export function DecisionNode({ data, selected }: DecisionNodeProps) {
  return (
    <div className={`px-3 py-2 shadow-lg bg-yellow-50 border-2 w-[140px] rounded-lg transition-all duration-200 ${
      selected ? 'border-blue-500 shadow-xl scale-105' : 'border-yellow-500'
    }`}>
      {/* Top input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-in"
        className="w-4 h-4 !bg-yellow-500 border-2 border-white shadow-lg hover:scale-125 transition-transform"
        style={{ top: -8 }}
      />
      
      {/* Left input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-in"
        className="w-4 h-4 !bg-yellow-500 border-2 border-white shadow-lg hover:scale-125 transition-transform"
        style={{ left: -8 }}
      />
      
      <div className="flex items-center gap-3">
        <div className="p-2 bg-yellow-500 rounded-lg text-white">
          <GitBranch className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-yellow-800">{data.label}</div>
          {data.description && (
            <div className="text-xs text-yellow-600 mt-1">{data.description}</div>
          )}
        </div>
      </div>

      {data.conditions && data.conditions.length > 0 && (
        <div className="mt-2">
          <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300">
            {data.conditions.length} condition(s)
          </Badge>
        </div>
      )}
      
      {/* Right side outputs for yes/no */}
      <Handle
        type="source"
        position={Position.Right}
        id="yes"
        className="w-4 h-4 !bg-green-500 border-2 border-white shadow-lg hover:scale-125 transition-transform"
        style={{ right: -8, top: '30%' }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="no"
        className="w-4 h-4 !bg-red-500 border-2 border-white shadow-lg hover:scale-125 transition-transform"
        style={{ right: -8, top: '70%' }}
      />
      
      {/* Bottom general output */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-out"
        className="w-4 h-4 !bg-yellow-500 border-2 border-white shadow-lg hover:scale-125 transition-transform"
        style={{ bottom: -8 }}
      />
    </div>
  );
} 