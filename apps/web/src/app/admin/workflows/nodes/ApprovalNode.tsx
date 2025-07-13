'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Users, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WorkflowNodeData } from '../types/workflow';

interface ApprovalNodeProps {
  data: WorkflowNodeData;
  selected?: boolean;
}

export function ApprovalNode({ data, selected }: ApprovalNodeProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-500 text-green-800';
      case 'failed': return 'bg-red-50 border-red-500 text-red-800';
      case 'running': return 'bg-blue-50 border-blue-500 text-blue-800';
      default: return 'bg-blue-50 border-blue-400 text-blue-700';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'running': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className={`px-3 py-2 shadow-lg rounded-lg border-2 w-[140px] transition-all duration-200 ${
      selected ? 'border-blue-500 shadow-xl scale-105' : getStatusColor(data.status)
    }`}>
      {/* Top input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-in"
        className="w-4 h-4 !bg-blue-500 border-2 border-white shadow-lg hover:scale-125 transition-transform"
        style={{ top: -8 }}
      />

      {/* Left input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-in"
        className="w-4 h-4 !bg-blue-500 border-2 border-white shadow-lg hover:scale-125 transition-transform"
        style={{ left: -8 }}
      />

      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500 rounded-lg text-white">
          <Users className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="font-bold">{data.label}</div>
          {data.description && (
            <div className="text-xs mt-1">{data.description}</div>
          )}
        </div>
        <div className="ml-auto">
          {getStatusIcon(data.status)}
        </div>
      </div>

      {data.permissions && data.permissions.length > 0 && (
        <div className="flex gap-1 mt-3">
          {data.permissions.map((permission, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {permission}
            </Badge>
          ))}
        </div>
      )}

      {data.actions && data.actions.length > 0 && (
        <div className="text-xs mt-2 text-blue-600">
          {data.actions.length} action(s) configured
        </div>
      )}

      {/* Right output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="right-out"
        className="w-4 h-4 !bg-blue-500 border-2 border-white shadow-lg hover:scale-125 transition-transform"
        style={{ right: -8 }}
      />

      {/* Bottom output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-out"
        className="w-4 h-4 !bg-blue-500 border-2 border-white shadow-lg hover:scale-125 transition-transform"
        style={{ bottom: -8 }}
      />
    </div>
  );
} 