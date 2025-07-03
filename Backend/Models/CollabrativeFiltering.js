const { MongoClient, ObjectId } = require("mongodb");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const dbName = "freelancing_platform";
const db = client.db(dbName);

// ✅ LRU Cache for fast access
class LRUCache {
    constructor(limit = 100) {
        this.limit = limit;
        this.cache = new Map();
    }

    get(key) {
        if (!this.cache.has(key)) return null;
        let value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    set(key, value) {
        if (this.cache.size >= this.limit) {
            let firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }
}

// ✅ Trie for optimized gig search
class TrieNode {
    constructor() {
        this.children = {};
        this.isEnd = false;
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(word) {
        let node = this.root;
        for (let char of word.toLowerCase()) {
            if (!node.children[char]) node.children[char] = new TrieNode();
            node = node.children[char];
        }
        node.isEnd = true;
    }

    search(prefix) {
        let node = this.root;
        for (let char of prefix.toLowerCase()) {
            if (!node.children[char]) return [];
            node = node.children[char];
        }
        return this.collectWords(node, prefix);
    }

    collectWords(node, prefix) {
        let words = [];
        if (node.isEnd) words.push(prefix);
        for (let char in node.children) {
            words = words.concat(this.collectWords(node.children[char], prefix + char));
        }
        return words;
    }
}

// ✅ Stack for user browsing history
class Stack {
    constructor() {
        this.items = [];
    }

    push(element) {
        this.items.push(element);
    }

    pop() {
        return this.items.length > 0 ? this.items.pop() : null;
    }

    peek() {
        return this.items.length > 0 ? this.items[this.items.length - 1] : null;
    }

    getAll() {
        return [...this.items];
    }
}

// ✅ Priority Queue for weighted recommendations
class PriorityQueue {
    constructor() {
        this.queue = [];
    }

    enqueue(item, priority) {
        this.queue.push({ item, priority });
        this.queue.sort((a, b) => b.priority - a.priority);
    }

    dequeueAll() {
        return this.queue.map(entry => entry.item);
    }
}

// ✅ Max Heap for trending gigs
class MaxHeap {
    constructor() {
        this.heap = [];
    }

    insert(gig) {
        this.heap.push(gig);
        this.heap.sort((a, b) => b.trendingScore - a.trendingScore);
    }

    getTop(n = 5) {
        return this.heap.slice(0, n);
    }
}

// ✅ AVL Tree for ranking-based sorting
class AVLNode {
    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.height = 1;
        this.left = null;
        this.right = null;
    }
}

class AVLTree {
    constructor() {
        this.root = null;
    }

    insertNode(node, key, value) {
        if (!node) return new AVLNode(key, value);
        if (key < node.key) node.left = this.insertNode(node.left, key, value);
        else node.right = this.insertNode(node.right, key, value);

        node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
        return this.balance(node);
    }

    balance(node) {
        let balance = this.getBalanceFactor(node);
        if (balance > 1) return this.rotateRight(node);
        if (balance < -1) return this.rotateLeft(node);
        return node;
    }

    rotateRight(y) {
        let x = y.left;
        y.left = x.right;
        x.right = y;
        return x;
    }

    rotateLeft(x) {
        let y = x.right;
        x.right = y.left;
        y.left = x;
        return y;
    }

    getHeight(node) {
        return node ? node.height : 0;
    }

    getBalanceFactor(node) {
        return this.getHeight(node.left) - this.getHeight(node.right);
    }

    insert(key, value) {
        this.root = this.insertNode(this.root, key, value);
    }

    inOrderTraversal(node = this.root, result = []) {
        if (node) {
            this.inOrderTraversal(node.left, result);
            result.push(node.value);
            this.inOrderTraversal(node.right, result);
        }
        return result;
    }
}

// ✅ Multi-Layer Graph for user-gig relationships
class UserGigGraph {
    constructor() {
        this.graph = new Map();
    }

    addInteraction(userId, gigId, category, sellerId) {
        if (!this.graph.has(userId)) {
            this.graph.set(userId, { category: new Set(), seller: new Set() });
        }
        this.graph.get(userId).category.add(category);
        this.graph.get(userId).seller.add(sellerId);
    }

    getSimilarUsers(userId) {
        if (!this.graph.has(userId)) return [];
        let similarUsers = new Map();
        let { category, seller } = this.graph.get(userId);

        this.graph.forEach((data, user) => {
            if (user !== userId) {
                let categoryMatch = [...category].filter(c => data.category.has(c)).length;
                let sellerMatch = [...seller].filter(s => data.seller.has(s)).length;
                let score = categoryMatch * 2 + sellerMatch * 1.5;
                if (score > 0) similarUsers.set(user, score);
            }
        });

        return [...similarUsers.entries()].sort((a, b) => b[1] - a[1]);
    }
}

// ✅ Collaborative Filtering & Ranking
class Gig {
    static collectionName = "gigs";
    static gigCache = new LRUCache(100);
    static gigRankingTree = new AVLTree();
    static gigTrie = new Trie();
    static gigTrendingHeap = new MaxHeap();
    static userGraph = new UserGigGraph();
    static userBrowsingHistory = new Map();

    constructor({ title, category, sellerId, rating = 0 }) {
        this.title = title;
        this.category = category;
        this.sellerId = sellerId;
        this.rating = rating;
        this.ranking = 0;
        this.trendingScore = 0;
    }

    static async recommendGigs(userId) {
        try {
            const collection = db.collection(this.collectionName);
            
            // Get active gigs with good ratings
            const gigs = await collection.find({
                status: "active",
                rating: { $gte: 4.0 }
            })
            .sort({ rating: -1, impressions: -1 })
            .limit(10)
            .toArray();

            // If we have fewer than 10 highly rated gigs, add some popular gigs
            if (gigs.length < 10) {
                const popularGigs = await collection.find({
                    status: "active",
                    rating: { $lt: 4.0 }
                })
                .sort({ impressions: -1 })
                .limit(10 - gigs.length)
                .toArray();

                gigs.push(...popularGigs);
            }

            // Shuffle the recommendations to add variety
            for (let i = gigs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [gigs[i], gigs[j]] = [gigs[j], gigs[i]];
            }

            return gigs;
        } catch (error) {
            console.error("Error in recommendGigs:", error);
            throw new Error("Failed to get recommendations");
        }
    }

    static async trackInteraction(userId, gigId, category) {
        try {
            const collection = db.collection(this.collectionName);
            await collection.updateOne(
                { _id: new ObjectId(gigId) },
                { $inc: { impressions: 1 } }
            );
        } catch (error) {
            console.error("Error tracking interaction:", error);
        }
    }

    static async calculateRanking(gig) {
        return gig.impressions * 0.5 + gig.clicks * 1.5 + gig.rating * 10;
    }

    static async getRankedGigs() {
        const gigCollection = db.collection(this.collectionName);
        const gigs = await gigCollection.find().toArray();

        this.gigRankingTree = new AVLTree();
        for (let gig of gigs) {
            gig.ranking = await this.calculateRanking(gig);
            this.gigRankingTree.insert(gig.ranking, gig);
            this.gigTrendingHeap.insert(gig);
        }

        return this.gigRankingTree.inOrderTraversal();
    }

    static async searchGigs(query) {
        return this.gigTrie.search(query);
    }
}

// Export the Gig class directly
module.exports = { Gig };
