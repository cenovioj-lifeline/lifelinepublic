/**
 * BookFeedItem
 *
 * Renders a single book content item based on its type.
 * Supports: insight, framework, story, quote, practical_use
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Lightbulb, PenTool, Users, Quote, Wrench, CheckSquare } from "lucide-react";
import type { BookContent, ContentType } from "@/types/book";
import { CONTENT_TYPE_CONFIG } from "@/types/book";

interface BookFeedItemProps {
  item: BookContent;
  authorName: string;
}

const TYPE_ICONS: Record<ContentType, typeof Lightbulb> = {
  insight: Lightbulb,
  framework: PenTool,
  story: Users,
  quote: Quote,
  practical_use: Wrench,
};

export function BookFeedItem({ item, authorName }: BookFeedItemProps) {
  const Icon = TYPE_ICONS[item.contentType] || CheckSquare;
  const config = CONTENT_TYPE_CONFIG[item.contentType];

  return (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-slate-200 text-slate-700">
            {authorName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">{authorName}</p>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-muted-foreground text-xs capitalize">
              {config.label}
            </span>
          </div>
          {item.chapterReference && (
            <p className="text-xs text-muted-foreground">{item.chapterReference}</p>
          )}
        </div>
      </CardHeader>

      {/* Content based on type */}
      <CardContent className="pb-8 space-y-4">
        {renderContent(item, Icon)}
      </CardContent>
    </Card>
  );
}

function renderContent(item: BookContent, Icon: typeof Lightbulb) {
  switch (item.contentType) {
    case 'quote':
      return <QuoteVisual item={item} />;
    case 'framework':
      return <FrameworkVisual item={item} Icon={Icon} />;
    case 'story':
      return <StoryVisual item={item} Icon={Icon} />;
    case 'practical_use':
      return <ApplicationVisual item={item} Icon={Icon} />;
    case 'insight':
    default:
      return <InsightVisual item={item} Icon={Icon} />;
  }
}

// Insight Visual - Featured card style
function InsightVisual({ item, Icon }: { item: BookContent; Icon: typeof Lightbulb }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border-l-4 border-l-slate-600 border-y border-r border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex gap-3 mb-4">
        <Icon className="h-5 w-5 text-slate-700 dark:text-slate-300 flex-shrink-0 mt-0.5" />
        <h3 className="font-bold text-xl text-slate-900 dark:text-white">{item.title}</h3>
      </div>
      <p className="text-base leading-relaxed text-slate-800 dark:text-slate-200 font-medium mb-4">
        {item.content}
      </p>
      {item.extendedData.details && Array.isArray(item.extendedData.details) && (
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          {item.extendedData.details.map((d: any, i: number) => (
            <div key={i}>
              <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                {d.label}
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {d.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Quote Visual - Centered with quote icon
function QuoteVisual({ item }: { item: BookContent }) {
  return (
    <div className="p-10 rounded-xl text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm">
      <Quote className="h-8 w-8 text-slate-400 mb-4" />
      <p className="font-serif text-2xl italic leading-relaxed">
        "{item.content}"
      </p>
    </div>
  );
}

// Framework Visual - List with numbered items
function FrameworkVisual({ item, Icon }: { item: BookContent; Icon: typeof Lightbulb }) {
  const items = item.extendedData.items as Array<{ id?: number; title: string; desc: string }> | undefined;
  const steps = item.extendedData.steps as string[] | undefined;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border-l-4 border-l-slate-600 border-y border-r border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex gap-3 mb-4">
        <Icon className="h-5 w-5 text-slate-700 dark:text-slate-300 flex-shrink-0 mt-0.5" />
        <h3 className="font-bold text-xl text-slate-900 dark:text-white">{item.title}</h3>
      </div>
      <p className="text-slate-800 dark:text-slate-200 font-medium mb-6">{item.content}</p>

      {/* Render items if present */}
      {items && items.length > 0 && (
        <div className="space-y-3">
          {items.map((sub, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
            >
              <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                {sub.id || i + 1}
              </div>
              <div className="pt-1">
                <p className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
                  {sub.title}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {sub.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Render steps if present (alternative format) */}
      {steps && steps.length > 0 && !items && (
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {i + 1}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 pt-0.5">{step}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Story Visual - Prose with optional blockquote
function StoryVisual({ item, Icon }: { item: BookContent; Icon: typeof Lightbulb }) {
  const storyQuote = item.extendedData.quote as string | undefined;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border-l-4 border-l-slate-600 border-y border-r border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex gap-3 mb-4">
        <Icon className="h-5 w-5 text-slate-700 dark:text-slate-300 flex-shrink-0 mt-0.5" />
        <h3 className="font-bold text-xl text-slate-900 dark:text-white">{item.title}</h3>
      </div>
      <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 font-medium">
        <p>{item.content}</p>
        {storyQuote && (
          <blockquote className="border-l-4 border-slate-300 pl-4 italic my-4 text-slate-600 dark:text-slate-400">
            "{storyQuote}"
          </blockquote>
        )}
      </div>
    </div>
  );
}

// Application/Practical Use Visual
function ApplicationVisual({ item, Icon }: { item: BookContent; Icon: typeof Lightbulb }) {
  const action = item.extendedData.action as { label: string; instruction: string } | undefined;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border-l-4 border-l-slate-600 border-y border-r border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex gap-3 mb-4">
        <Icon className="h-5 w-5 text-slate-700 dark:text-slate-300 flex-shrink-0 mt-0.5" />
        <h3 className="font-bold text-xl text-slate-900 dark:text-white">{item.title}</h3>
      </div>
      <p className="text-base leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
        {item.content}
      </p>
      {action && (
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
            {action.label}
          </p>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {action.instruction}
          </p>
        </div>
      )}
    </div>
  );
}
