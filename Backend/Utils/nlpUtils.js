const natural = require('natural');
const nlp = require('compromise');

// Initialize Natural's tokenizer and stemmer
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Stop words to filter out
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 
  'about', 'by', 'from', 'of', 'is', 'are', 'am', 'was', 'were', 'be', 'been',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those',
  'will', 'good', 'create', 'make', 'can', 'do', 'my', 'your', 'our', 'their', 'f'
]);

// Domain-specific synonyms for better matching
const DOMAIN_SYNONYMS = {
  'web': ['website', 'webpage', 'site', 'html', 'css', 'javascript', 'frontend', 'backend', 'fullstack'],
  'programming': ['coding', 'development', 'software', 'app', 'application', 'developer'],
  'logo': ['brand', 'identity', 'symbol', 'emblem', 'trademark'],
  'content': ['writing', 'article', 'blog', 'copywriting', 'text'],
  'php': ['backend', 'web', 'server', 'development', 'scripting', 'mysql', 'database'],
  'design': ['graphic', 'visual', 'ui', 'ux', 'creative', 'artwork'],
  'marketing': ['promotion', 'advertising', 'social media', 'digital marketing', 'seo'],
  'writing': ['content', 'copywriting', 'blog', 'article', 'proofreading', 'editing']
};

/**
 * Process text to get tokens, stems, nouns, etc.
 * @param {string} text - The text to process
 * @returns {Object} - Object with processed text features
 */
const processText = (text) => {
  if (!text) return { tokens: [], stems: [], nouns: [], adjectives: [], expandedTerms: [] };
  
  // Convert to lowercase and tokenize
  const tokens = tokenizer.tokenize(text.toLowerCase());
  
  // Remove stop words and stem tokens
  const filteredTokens = tokens.filter(token => !STOP_WORDS.has(token));
  const stems = filteredTokens.map(token => stemmer.stem(token));
  
  // Extract nouns and adjectives using compromise
  const doc = nlp(text);
  const nouns = doc.nouns().out('array');
  const adjectives = doc.adjectives().out('array');
  
  // Expand tokens with domain-specific synonyms
  const expandedTerms = [...filteredTokens];
  filteredTokens.forEach(token => {
    // Find any domain synonyms for this token
    Object.entries(DOMAIN_SYNONYMS).forEach(([key, synonyms]) => {
      if (token === key || synonyms.includes(token)) {
        // Add the key and all synonyms to expanded terms
        expandedTerms.push(key);
        expandedTerms.push(...synonyms);
      }
    });
  });
  
  return {
    tokens: filteredTokens,
    stems,
    nouns,
    adjectives,
    expandedTerms: [...new Set(expandedTerms)] // Remove duplicates
  };
};

/**
 * Calculate similarity score between query and text
 * @param {string} query - The search query
 * @param {string} text - The text to match against
 * @returns {number} - Similarity score between 0 and 1
 */
const calculateSimilarity = (query, text) => {
  if (!query || !text) return 0;
  
  const queryData = processText(query);
  const textData = processText(text);

  // If no query tokens remain after filtering (e.g., only stop words), return 0
  if (queryData.tokens.length === 0) return 0;
  
  // Must have at least one main token match (exact or synonym) to be considered at all
  const exactMatches = queryData.tokens.filter(token => 
    textData.tokens.includes(token) || text.toLowerCase().includes(token)
  );
  
  const expandedMatches = queryData.tokens.filter(token =>
    textData.expandedTerms.includes(token) || 
    queryData.expandedTerms.some(expanded => textData.tokens.includes(expanded))
  );
  
  // If no direct or expanded matches, return 0 immediately
  if (exactMatches.length === 0 && expandedMatches.length === 0) {
    return 0;
  }
  
  // Calculate overlap of stems (more basic matching)
  const stemOverlap = queryData.stems.filter(stem => 
    textData.stems.includes(stem)
  ).length;
  
  // Calculate exact token matches (excluding stop words)
  const tokenMatch = exactMatches.length;
  
  // Calculate expanded term matches (domain synonyms)
  const expandedMatch = expandedMatches.length;
  
  // Calculate noun matches (more important semantically)
  const nounMatch = queryData.nouns.filter(noun => 
    textData.nouns.includes(noun) || textData.tokens.includes(noun.toLowerCase())
  ).length;
  
  // Calculate adjective matches
  const adjectiveMatch = queryData.adjectives.filter(adj => 
    textData.adjectives.includes(adj) || textData.tokens.includes(adj.toLowerCase())
  ).length;
  
  // Calculate TF-IDF similarity if there are tokens
  let tfidfSimilarity = 0;
  if (queryData.tokens.length > 0 && textData.tokens.length > 0) {
    const tfidf = new natural.TfIdf();
    tfidf.addDocument(textData.tokens);
    let totalScore = 0;
    
    queryData.tokens.forEach(token => {
      totalScore += tfidf.tfidf(token, 0);
    });
    
    tfidfSimilarity = totalScore / queryData.tokens.length;
  }
  
  // Combine scores with weights (heavily weighted toward exact matches)
  const tokenWeight = 0.5;      // Increased from 0.3
  const stemWeight = 0.1;       // Reduced from 0.15
  const expandedWeight = 0.2;   // Reduced from 0.25
  const nounWeight = 0.15;      // Reduced from 0.2
  const adjectiveWeight = 0.0;  // Eliminated (was 0.05)
  const tfidfWeight = 0.05;     // Unchanged
  
  // Normalize scores
  const normalizedTokenMatch = queryData.tokens.length > 0 ? tokenMatch / queryData.tokens.length : 0;
  const normalizedStemMatch = queryData.stems.length > 0 ? stemOverlap / queryData.stems.length : 0;
  const normalizedExpandedMatch = queryData.tokens.length > 0 ? expandedMatch / queryData.tokens.length : 0;
  const normalizedNounMatch = queryData.nouns.length > 0 ? nounMatch / queryData.nouns.length : 0;
  const normalizedAdjMatch = queryData.adjectives.length > 0 ? adjectiveMatch / queryData.adjectives.length : 0;
  
  // Calculate weighted score
  const totalScore = (
    normalizedTokenMatch * tokenWeight +
    normalizedStemMatch * stemWeight +
    normalizedExpandedMatch * expandedWeight +
    normalizedNounMatch * nounWeight +
    normalizedAdjMatch * adjectiveWeight +
    tfidfSimilarity * tfidfWeight
  );
  
  return totalScore;
};

/**
 * Perform a simple exact keyword search as fallback
 * @param {string} query - The search query 
 * @param {Array} gigs - The array of gigs to search
 * @returns {Array} - Matching gigs
 */
const exactKeywordSearch = (query, gigs) => {
  try {
    if (!query) return [];
    
    const searchTerms = query.toLowerCase().split(/\s+/)
      .filter(term => !STOP_WORDS.has(term) && term.length > 1);
      
    if (searchTerms.length === 0) return [];
    
    // Simple relevance scoring for keyword matches
    const scoredGigs = gigs.map(gig => {
      try {
        const gigText = `${gig.title || ''} ${gig.description || ''} ${gig.category || ''}`.toLowerCase();
        
        // Count how many search terms match
        let matchCount = 0;
        searchTerms.forEach(term => {
          if (gigText.includes(term)) matchCount++;
        });
        
        // Calculate a simple score based on percentage of terms matched
        const score = searchTerms.length > 0 ? matchCount / searchTerms.length : 0;
        
        return {
          ...gig,
          _keywordScore: score
        };
      } catch (err) {
        console.error(`Error processing gig in keyword search: ${err.message}`);
        return { ...gig, _keywordScore: 0 };
      }
    });
    
    // Filter to only include gigs with at least one match and sort by score
    return scoredGigs
      .filter(gig => gig._keywordScore > 0)
      .sort((a, b) => b._keywordScore - a._keywordScore);
      
  } catch (err) {
    console.error(`Error in exactKeywordSearch: ${err.message}`);
    return [];
  }
};

/**
 * Rank gigs based on semantic similarity to the search query
 * @param {string} query - The search query
 * @param {Array} gigs - The array of gigs to rank
 * @param {number} threshold - Minimum similarity score (0-1)
 * @returns {Array} - Filtered and ranked gigs by relevance
 */
const rankGigsByRelevance = (query, gigs, threshold = 0.25) => {
  if (!query) return gigs;
  
  try {
    console.log(`[NLP Search] Processing query: "${query}"`);
    
    // Extract meaningful terms from query
    const queryTerms = query.trim().split(/\s+/);
    const meaningfulQuery = queryTerms
      .filter(term => !STOP_WORDS.has(term.toLowerCase()) && term.length > 1)
      .join(' ');
      
    // If no meaningful terms are left, return all gigs
    if (!meaningfulQuery) {
      console.log(`[NLP Search] No meaningful terms extracted from "${query}"`);
      return gigs;
    }
    
    console.log(`[NLP Search] Using meaningful query: "${meaningfulQuery}"`);
    
    // Calculate similarity scores for each gig
    const scoredGigs = gigs.map(gig => {
      try {
        // Safely get tags as string
        const tagsString = Array.isArray(gig.tags) ? gig.tags.join(' ') : 
                          (gig.tags ? String(gig.tags) : '');
                          
        // Combine title and description for better matching
        const combinedText = `${gig.title || ''} ${gig.description || ''} ${gig.category || ''} ${gig.subcategory || ''} ${tagsString}`;
        const similarityScore = calculateSimilarity(meaningfulQuery, combinedText);
        
        return {
          ...gig,
          _similarityScore: similarityScore
        };
      } catch (err) {
        console.error(`[NLP Search] Error processing gig (${gig._id}): ${err.message}`);
        return { ...gig, _similarityScore: 0 };
      }
    });
    
    // Get gigs that pass the similarity threshold
    const semanticMatches = scoredGigs
      .filter(gig => gig._similarityScore >= threshold)
      .sort((a, b) => b._similarityScore - a._similarityScore);
    
    console.log(`[NLP Search] Found ${semanticMatches.length} semantic matches with threshold ${threshold}`);
    
    // If we got semantic matches, return them
    if (semanticMatches.length > 0) {
      return semanticMatches;
    }
    
    // Fallback to exact keyword matching if semantic search returns no results
    console.log(`[NLP Search] No semantic matches found for "${query}", falling back to keyword search`);
    return exactKeywordSearch(query, gigs);
  } catch (err) {
    console.error(`[NLP Search] Error in rankGigsByRelevance: ${err.message}`);
    // Fallback to original gigs
    return gigs;
  }
};

module.exports = {
  processText,
  calculateSimilarity,
  rankGigsByRelevance
}; 