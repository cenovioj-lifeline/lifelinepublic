import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Quote {
  id: string;
  quote: string;
  author?: string | null;
  context?: string | null;
}

export function useCollectionQuote(collectionId: string, quotesEnabled: boolean, quoteFrequency: number) {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [dismissedQuote, setDismissedQuote] = useState(false);

  useEffect(() => {
    if (!quotesEnabled || dismissedQuote) return;

    const fetchRandomQuote = async () => {
      try {
        const { data, error } = await supabase
          .from("collection_quotes")
          .select("*")
          .eq("collection_id", collectionId);

        if (error) throw error;
        if (!data || data.length === 0) return;

        // Get a random quote
        const randomQuote = data[Math.floor(Math.random() * data.length)];
        setCurrentQuote(randomQuote);
      } catch (error) {
        console.error("Error fetching quote:", error);
      }
    };

    fetchRandomQuote();
  }, [collectionId, quotesEnabled, dismissedQuote]);

  const dismissQuote = () => {
    setDismissedQuote(true);
    setCurrentQuote(null);
  };

  return { currentQuote, dismissQuote };
}