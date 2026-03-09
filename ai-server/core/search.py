# core/search.py

def levenshtein_distance(s1, s2):
    '''
    the number of operation required to change string 1 to 2
    '''
    
    if len(s1) == 0: return len(s2)
    if len(s2) == 0: return len(s1)

    len1, len2 = len(s1), len(s2)
    dp = [[0] * (len2 + 1) for _ in range(len1 + 1)]

    for i in range(len1 + 1): dp[i][0] = i
    for j in range(len2 + 1): dp[0][j] = j

    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            cost = 0 if s1[i - 1].lower() == s2[j - 1].lower() else 1
            dp[i][j] = min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
            
    return dp[len1][len2]

def get_similarity_score(w1, w2):
    '''
    convert in percentage for comparison
    '''
    
    dist = levenshtein_distance(w1.lower(), w2.lower())
    max_len = max(len(w1), len(w2))
    if max_len == 0: return 100
    return ((max_len - dist) / max_len) * 100

def multi_word_fuzzy_match(query, target):
    '''best average score'''
    query_words = [w for w in query.lower().split() if w.strip()]
    target_words = [w for w in target.lower().split() if w.strip()]
    
    if not query_words or not target_words:
        return 0
        
    total_score = 0
    for q_word in query_words:
        best_match_for_q = 0
        for t_word in target_words:
            score = get_similarity_score(q_word, t_word)
            if score > best_match_for_q:
                best_match_for_q = score
        total_score += best_match_for_q
        
    average_score = total_score / len(query_words)
    return average_score

def fuzzy_match_strings(query, string_list):
    '''category and course page'''
    if not query.strip():
        return string_list
        
    scored_results = []
    query_lower = query.lower().strip()
    
    for item in string_list:
        if query_lower in item.lower():
            scored_results.append((100, item))
            continue
            
        score = multi_word_fuzzy_match(query_lower, item)
        if score >= 50: # Threshold for strings
            scored_results.append((score, item))
            
    scored_results.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored_results]

def perform_fuzzy_search(query, topic, data):
    '''question page'''
    topic_problems = [p for p in data if p.get('topic') == topic]
    if not query.strip():
        return topic_problems

    scored_results = []
    query_lower = query.lower().strip()
    
    for problem in topic_problems:
        title = problem.get('title', '')
        if query_lower in title.lower():
            scored_results.append((100, problem))
            continue
            
        score = multi_word_fuzzy_match(query_lower, title)
        if score >= 55:
            scored_results.append((score, problem))
            
    scored_results.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored_results[:10]]