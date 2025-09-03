'use client';

import React, { useState } from 'react';
import { Search, Loader2, Clipboard, Eraser, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrackingForm, useTrackingQuery, parseTrackingInput } from '@/stores/tracking';
import { copyToClipboard, readFromClipboard } from '@/lib/utils';

interface TrackingFormProps {
  onSubmit?: (trackingNumbers: string[]) => void;
}

export function TrackingForm({ onSubmit }: TrackingFormProps) {
  const { formData, updateFormData, resetForm } = useTrackingForm();
  const { isLoading, loadingMessage, progress, queryTracking, error, clearError } = useTrackingQuery();
  const [showExample, setShowExample] = useState(false);

  const maxItems = 50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!formData.trackingNumbers.trim()) {
      return;
    }

    const trackingNumbers = parseTrackingInput(formData.trackingNumbers);
    
    if (trackingNumbers.length === 0) {
      return;
    }

    if (trackingNumbers.length > maxItems) {
      alert(`批量查询最多支持${maxItems}个单号`);
      return;
    }

    try {
      await queryTracking(trackingNumbers);
      if (onSubmit) {
        onSubmit(trackingNumbers);
      }
    } catch (error) {
      console.error('查询失败:', error);
    }
  };

  const handleClear = () => {
    updateFormData({ trackingNumbers: '' });
    clearError();
  };

  const handlePaste = async () => {
    try {
      const text = await readFromClipboard();
      if (text) {
        updateFormData({ trackingNumbers: text });
      }
    } catch (error) {
      console.error('粘贴失败:', error);
    }
  };

  const handleShowExample = () => {
    const examples = [
      'CBEL123456789',
      'PO987654321',
      'TRK456789123',
      'JOB789123456'
    ];
    updateFormData({ trackingNumbers: examples.join('\n') });
    setShowExample(false);
  };

  const trackingNumbers = parseTrackingInput(formData.trackingNumbers);
  const isValid = trackingNumbers.length > 0 && trackingNumbers.length <= maxItems;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <Search className="h-6 w-6 text-primary" />
          物流轨迹查询
        </CardTitle>
        <CardDescription>
          支持多种单号格式，批量查询最多{maxItems}个单号
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 输入区域 */}
          <div className="space-y-2">
            <label htmlFor="trackingInput" className="text-sm font-medium">
              跟踪单号 {trackingNumbers.length > 0 && (
                <span className="text-muted-foreground">
                  ({trackingNumbers.length}/{maxItems})
                </span>
              )}
            </label>
            <Textarea
              id="trackingInput"
              placeholder="请输入跟踪单号，支持多个单号（每行一个）&#10;支持格式：JobNum、PO号、跟踪号等"
              value={formData.trackingNumbers}
              onChange={(e) => updateFormData({ trackingNumbers: e.target.value })}
              className="min-h-[120px] resize-y"
              disabled={isLoading}
            />
            
            {trackingNumbers.length > maxItems && (
              <p className="text-sm text-destructive">
                单号数量超过限制，最多支持{maxItems}个单号
              </p>
            )}
          </div>

          {/* 选项 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoFormat}
                onChange={(e) => updateFormData({ autoFormat: e.target.checked })}
                className="rounded border-gray-300"
                disabled={isLoading}
              />
              <span className="text-sm">自动格式化单号</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showDetails}
                onChange={(e) => updateFormData({ showDetails: e.target.checked })}
                className="rounded border-gray-300"
                disabled={isLoading}
              />
              <span className="text-sm">显示详细信息</span>
            </label>
          </div>

          {/* 快速操作 */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-sm font-medium text-muted-foreground">快速操作:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={isLoading || !formData.trackingNumbers}
              className="h-8"
            >
              <Eraser className="h-3 w-3 mr-1" />
              清空
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePaste}
              disabled={isLoading}
              className="h-8"
            >
              <Clipboard className="h-3 w-3 mr-1" />
              粘贴
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShowExample}
              disabled={isLoading}
              className="h-8"
            >
              <Lightbulb className="h-3 w-3 mr-1" />
              示例
            </Button>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* 提交按钮 */}
          <Button
            type="submit"
            disabled={!isValid || isLoading}
            className="w-full h-12 text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {loadingMessage || '查询中...'}
                {progress > 0 && ` (${progress}%)`}
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                查询轨迹
                {trackingNumbers.length > 1 && ` (${trackingNumbers.length}个)`}
              </>
            )}
          </Button>

          {/* 进度条 */}
          {isLoading && progress > 0 && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
