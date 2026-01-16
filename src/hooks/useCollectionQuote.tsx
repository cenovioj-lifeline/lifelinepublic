import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Quote {
  id: string;
  quote: string;
  author?: string | null;
  context?: string | null;
}

export function useCollectionQuote(collectionId: string, quotesEnabled: boolean, quoteFrequency: number) {
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedQuote, setDismissedQuote] = useState(false);

  useEffect(() => {
    if (!quotesEnabled || dismissedQuote || !collectionId) return;

    const fetchQuotes = async () => {
      try {
        const { data, error } = await supabase
          .from("collection_quotes")
          .select("*")
          .eq("collection_id", collectionId);

        if (error) throw error;
        if (!data || data.length === 0) return;

        setAllQuotes(data);
        // Start at a random quote
        setCurrentIndex(Math.floor(Math.random() * data.length));
      } catch (error) {
        console.error("Error fetching quote:", error);
      }
    };

    fetchQuotes();
  }, [collectionId, quotesEnabled, dismissedQuote]);

  const currentQuote = allQuotes.length > 0 ? allQuotes[currentIndex] : null;

  const nextQuote = () => {
    if (allQuotes.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % allQuotes.length);
    }
  };

  const dismissQuote = () => {
    setDismissedQuote(true);
  };

  return { 
    currentQuote, 
    dismissQuote, 
    nextQuote, 
    hasMultipleQuotes: allQuotes.length > 1 
  };
}