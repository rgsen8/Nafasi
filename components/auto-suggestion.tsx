"use client";

import React, { useEffect, useState, useRef } from 'react';
import { User, Tag, Palette } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// 定义建议数据的类型
interface Suggestion {
  name: string;
  type: 'customer' | 'model' | 'color';
}

interface AutoSuggestionProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
  isInvalid: boolean;
  type?: 'customer' | 'model' | 'color';
  suggestions: Suggestion[];
}

export default function AutoSuggestion({
  label,
  value,
  onChange,
  onSelect,
  isInvalid,
  type,
  suggestions,
}: AutoSuggestionProps) {
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 仅根据输入值和类型过滤建议列表，不再控制显示状态
    if (value && value.length > 0) {
      const filtered = suggestions.filter(suggestion => {
        const matchesType = type ? suggestion.type === type : true;
        const matchesValue = suggestion.name.toLowerCase().includes(value.toLowerCase());
        return matchesType && matchesValue;
      });
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(suggestions);
    }
  }, [value, type, suggestions]);

  useEffect(() => {
    // 修复：在调用 toLowerCase() 之前检查 value 是否存在，以避免报错
    if (value) {
      // 新增逻辑: 当输入值与某个建议完全匹配时，隐藏提示框
      const isExactMatch = suggestions.some(
        (suggestion) => suggestion.name.toLowerCase() === value.toLowerCase()
      );
      if (isExactMatch) {
        setShowSuggestions(false);
      }
    }
  }, [value, suggestions]);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    onSelect(suggestion.name);
    setShowSuggestions(false);
  };

  const getIcon = (itemType: "customer" | "model" | "color") => {
    const iconClass = "h-4 w-4 text-muted-foreground flex-shrink-0";
    switch (itemType) {
      case "customer":
        return <User className={iconClass} />;
      case "model":
        return <Tag className={iconClass} />;
      case "color":
        return <Palette className={iconClass} />;
      default:
        return <User className={iconClass} />;
    }
  };

  return (
    <div className="relative flex flex-col gap-2" ref={wrapperRef}>
      <Label htmlFor={label}>{label}</Label>
      <Input
        type="text"
        id={label}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onFocus={() => {
          // 在焦点进入时，如果存在建议，则显示
          if (filteredSuggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        onBlur={() => {
          setTimeout(() => {
            setShowSuggestions(false);
          }, 0);
        }}
        className={isInvalid ? "border-red-500" : ""}
      />
      {isInvalid && (
        <p className="text-red-500 text-sm mt-1">
          输入的值不在建议列表中，请从列表中选择或确认输入正确。
        </p>
      )}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          className="absolute z-10 w-full top-full bg-white border border-gray-200 rounded-md shadow-sm max-h-40 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSuggestionClick(suggestion);
              }}
              className="w-full px-2 py-1.5 text-left hover:bg-gray-100 transition-colors flex items-center gap-2 border-b border-gray-100 last:border-b-0"
            >
              {getIcon(suggestion.type)}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{suggestion.name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
