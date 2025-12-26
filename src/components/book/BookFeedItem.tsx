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
  hasContext?: boolean;
}

const TYPE_ICONS: Record<ContentType, typeof Lightbulb> = {
  insight: Lightbulb,
  framework: PenTool,
  story: Users,
  quote: Quote,
  practical_use: Wrench,
};

export function BookFeedItem({ item, authorName, hasContext = false }: BookFeedItemProps) {
  const Icon = TYPE_ICONS[item.contentType] || CheckSquare;
  const config = CONTENT_TYPE_CONFIG[item.contentType];

  return (
    <Card 
      className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow"
      style={{ backgroundColor: hasContext ? "hsl(var(--scheme-cards-bg))" : undefined }}
    >
      {/* Header */}
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-10 w-10">
          <AvatarFallback 
            style={{ 
              backgroundColor: hasContext ? "hsl(var(--scheme-nav-bg) / 0.2)" : "hsl(220 13% 91%)",
              color: hasContext ? "hsl(var(--scheme-title-text))" : "hsl(220 9% 30%)"
            }}
          >
            {authorName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p 
              className="font-semibold text-sm"
              style={{ color: hasContext ? "hsl(var(--scheme-title-text))" : undefined }}
            >
              {authorName}
            </p>
            <span 
              className="text-xs"
              style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(var(--muted-foreground))" }}
            >
              •
            </span>
            <span 
              className="text-xs capitalize"
              style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(var(--muted-foreground))" }}
            >
              {config.label}
            </span>
          </div>
          {item.chapterReference && (
            <p 
              className="text-xs"
              style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(var(--muted-foreground))" }}
            >
              {item.chapterReference}
            </p>
          )}
        </div>
      </CardHeader>

      {/* Content based on type */}
      <CardContent className="pb-8 space-y-4">
        {renderContent(item, Icon, hasContext)}
      </CardContent>
    </Card>
  );
}

function renderContent(item: BookContent, Icon: typeof Lightbulb, hasContext: boolean) {
  switch (item.contentType) {
    case 'quote':
      return <QuoteVisual item={item} hasContext={hasContext} />;
    case 'framework':
      return <FrameworkVisual item={item} Icon={Icon} hasContext={hasContext} />;
    case 'story':
      return <StoryVisual item={item} Icon={Icon} hasContext={hasContext} />;
    case 'practical_use':
      return <ApplicationVisual item={item} Icon={Icon} hasContext={hasContext} />;
    case 'insight':
    default:
      return <InsightVisual item={item} Icon={Icon} hasContext={hasContext} />;
  }
}

// Insight Visual - Featured card style
function InsightVisual({ item, Icon, hasContext }: { item: BookContent; Icon: typeof Lightbulb; hasContext: boolean }) {
  return (
    <div 
      className="p-6 rounded-xl border-l-4 border-y border-r shadow-sm"
      style={{
        backgroundColor: hasContext ? "hsl(var(--scheme-cards-bg))" : "hsl(var(--background))",
        borderLeftColor: hasContext ? "hsl(var(--scheme-nav-button))" : "hsl(220 9% 30%)",
        borderTopColor: hasContext ? "hsl(var(--scheme-cards-border))" : "hsl(220 13% 91%)",
        borderRightColor: hasContext ? "hsl(var(--scheme-cards-border))" : "hsl(220 13% 91%)",
        borderBottomColor: hasContext ? "hsl(var(--scheme-cards-border))" : "hsl(220 13% 91%)"
      }}
    >
      <div className="flex gap-3 mb-4">
        <Icon 
          className="h-5 w-5 flex-shrink-0 mt-0.5"
          style={{ color: hasContext ? "hsl(var(--scheme-title-text))" : "hsl(220 9% 30%)" }}
        />
        <h3 
          className="font-bold text-xl"
          style={{ color: hasContext ? "hsl(var(--scheme-title-text))" : undefined }}
        >
          {item.title}
        </h3>
      </div>
      <p 
        className="text-base leading-relaxed font-medium mb-4"
        style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(220 9% 20%)" }}
      >
        {item.content}
      </p>
      {item.extendedData.details && Array.isArray(item.extendedData.details) && (
        <div 
          className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t"
          style={{ borderColor: hasContext ? "hsl(var(--scheme-cards-border))" : "hsl(220 13% 91%)" }}
        >
          {item.extendedData.details.map((d: any, i: number) => (
            <div key={i}>
              <p 
                className="text-xs font-bold uppercase"
                style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(220 9% 46%)" }}
              >
                {d.label}
              </p>
              <p 
                className="text-sm font-medium"
                style={{ color: hasContext ? "hsl(var(--scheme-title-text))" : undefined }}
              >
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
function QuoteVisual({ item, hasContext }: { item: BookContent; hasContext: boolean }) {
  return (
    <div 
      className="p-10 rounded-xl text-center flex flex-col items-center justify-center border shadow-sm"
      style={{
        backgroundColor: hasContext ? "hsl(var(--scheme-cards-bg))" : "hsl(var(--background))",
        borderColor: hasContext ? "hsl(var(--scheme-cards-border))" : "hsl(220 13% 91%)"
      }}
    >
      <Quote 
        className="h-8 w-8 mb-4"
        style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(220 9% 64%)" }}
      />
      <p 
        className="font-serif text-2xl italic leading-relaxed"
        style={{ color: hasContext ? "hsl(var(--scheme-title-text))" : undefined }}
      >
        "{item.content}"
      </p>
    </div>
  );
}

// Framework Visual - List with numbered items
function FrameworkVisual({ item, Icon, hasContext }: { item: BookContent; Icon: typeof Lightbulb; hasContext: boolean }) {
  const items = item.extendedData.items as Array<{ id?: number; title: string; desc: string }> | undefined;
  const steps = item.extendedData.steps as string[] | undefined;

  return (
    <div 
      className="p-6 rounded-xl border-l-4 border-y border-r shadow-sm"
      style={{
        backgroundColor: hasContext ? "hsl(var(--scheme-cards-bg))" : "hsl(var(--background))",
        borderLeftColor: hasContext ? "hsl(var(--scheme-nav-button))" : "hsl(220 9% 30%)",
        borderTopColor: hasContext ? "hsl(var(--scheme-cards-border))" : "hsl(220 13% 91%)",
        borderRightColor: hasContext ? "hsl(var(--scheme-cards-border))" : "hsl(220 13% 91%)",
        borderBottomColor: hasContext ? "hsl(var(--scheme-cards-border))" : "hsl(220 13% 91%)"
      }}
    >
      <div className="flex gap-3 mb-4">
        <Icon 
          className="h-5 w-5 flex-shrink-0 mt-0.5"
          style={{ color: hasContext ? "hsl(var(--scheme-title-text))" : "hsl(220 9% 30%)" }}
        />
        <h3 
          className="font-bold text-xl"
          style={{ color: hasContext ? "hsl(var(--scheme-title-text))" : undefined }}
        >
          {item.title}
        </h3>
      </div>
      <p 
        className="font-medium mb-6"
        style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(220 9% 20%)" }}
      >
        {item.content}
      </p>

      {/* Render items if present */}
      {items && items.length > 0 && (
        <div className="space-y-3">
          {items.map((sub, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 rounded-lg border shadow-sm transition-all hover:shadow-md"
              style={{
                backgroundColor: hasContext ? "hsl(var(--scheme-collection-bg) / 0.5)" : "hsl(220 14% 96%)",
                borderColor: hasContext ? "hsl(var(--scheme-cards-border))" : "hsl(220 13% 91%)"
              }}
            >
              <div 
                className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm"
                style={{ 
                  backgroundColor: hasContext ? "hsl(var(--scheme-nav-button))" : "hsl(220 9% 20%)",
                  color: hasContext ? "hsl(var(--scheme-nav-text))" : "white"
                }}
              >
                {sub.id || i + 1}
              </div>
              <div className="pt-1">
                <p 
                  className="font-bold text-base mb-1"
                  style={{ color: hasContext ? "hsl(var(--scheme-title-text))" : undefined }}
                >
                  {sub.title}
                </p>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(220 9% 40%)" }}
                >
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
              <div 
                className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ 
                  backgroundColor: hasContext ? "hsl(var(--scheme-nav-button))" : "hsl(220 9% 20%)",
                  color: hasContext ? "hsl(var(--scheme-nav-text))" : "white"
                }}
              >
                {i + 1}
              </div>
              <p 
                className="text-sm pt-0.5"
                style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(220 9% 30%)" }}
              >
                {step}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Story Visual - Prose with optional blockquote
function StoryVisual({ item, Icon, hasContext }: { item: BookContent; Icon: typeof Lightbulb; hasContext: boolean }) {
  const storyQuote = item.extendedData.quote as string | undefined;

  return (
    <div 
      className="p-6 rounded-xl border-l-4 border-y border-r shadow-sm"
      style={{
        backgroundColor: hasContext ? "hsl(var(--scheme-cards-bg))" : "hsl(var(--background))",
        borderLeftColor: hasContext ? "hsl(var(--scheme-nav-button))" : "hsl(220 9% 30%)",
        borderTopColor: hasContext ? "hsl(var(--scheme-cards-border))" : "hsl(220 13% 91%)",
        borderRightColor: hasContext ? "hsl(var(--scheme-cards-border))" : "hsl(220 13% 91%)",
        borderBottomColor: hasContext ? "hsl(var(--scheme-cards-border))" : "hsl(220 13% 91%)"
      }}
    >
      <div className="flex gap-3 mb-4">
        <Icon 
          className="h-5 w-5 flex-shrink-0 mt-0.5"
          style={{ color: hasContext ? "hsl(var(--scheme-title-text))" : "hsl(220 9% 30%)" }}
        />
        <h3 
          className="font-bold text-xl"
          style={{ color: hasContext ? "hsl(var(--scheme-title-text))" : undefined }}
        >
          {item.title}
        </h3>
      </div>
      <div className="prose dark:prose-invert max-w-none">
        <p 
          className="font-medium"
          style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(220 9% 20%)" }}
        >
          {item.content}
        </p>
        {storyQuote && (
          <blockquote 
            className="border-l-4 pl-4 italic my-4"
            style={{ 
              borderColor: hasContext ? "hsl(var(--scheme-cards-border))" : "hsl(220 13% 80%)",
              color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(220 9% 40%)"
            }}
          >
            "{storyQuote}"
          </blockquote>
        )}
      </div>
    </div>
  );
}

// Application/Practical Use Visual
function ApplicationVisual({ item, Icon, hasContext }: { item: BookContent; Icon: typeof Lightbulb; hasContext: boolean }) {
  const action = item.extendedData.action as { label: string; instruction: string } | undefined;

  return (
    <div 
      className="p-6 rounded-xl border-l-4 border-y border-r shadow-sm"
      style={{
        backgroundColor: hasContext ? "hsl(var(--scheme-cards-bg))" : "hsl(var(--background))",
        borderLeftColor: hasContext ? "hsl(var(--scheme-nav-button))" : "hsl(220 9% 30%)",
        borderTopColor: hasContext ? "hsl(var(--scheme-cards-border))" : "hsl(220 13% 91%)",
        borderRightColor: hasContext ? "hsl(var(--scheme-cards-border))" : "hsl(220 13% 91%)",
        borderBottomColor: hasContext ? "hsl(var(--scheme-cards-border))" : "hsl(220 13% 91%)"
      }}
    >
      <div className="flex gap-3 mb-4">
        <Icon 
          className="h-5 w-5 flex-shrink-0 mt-0.5"
          style={{ color: hasContext ? "hsl(var(--scheme-title-text))" : "hsl(220 9% 30%)" }}
        />
        <h3 
          className="font-bold text-xl"
          style={{ color: hasContext ? "hsl(var(--scheme-title-text))" : undefined }}
        >
          {item.title}
        </h3>
      </div>
      <p 
        className="text-base leading-relaxed font-medium"
        style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(220 9% 20%)" }}
      >
        {item.content}
      </p>
      {action && (
        <div 
          className="mt-4 p-4 rounded-lg border"
          style={{
            backgroundColor: hasContext ? "hsl(var(--scheme-collection-bg) / 0.5)" : "hsl(220 14% 96%)",
            borderColor: hasContext ? "hsl(var(--scheme-cards-border))" : "hsl(220 13% 91%)"
          }}
        >
          <p 
            className="text-xs font-bold uppercase mb-1"
            style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(220 9% 46%)" }}
          >
            {action.label}
          </p>
          <p 
            className="text-sm font-medium"
            style={{ color: hasContext ? "hsl(var(--scheme-title-text))" : undefined }}
          >
            {action.instruction}
          </p>
        </div>
      )}
    </div>
  );
}
