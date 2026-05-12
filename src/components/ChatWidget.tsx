import { useState, useRef, useEffect } from "react";
import { useApp } from "../store";
import type { Restaurant, Bill } from "../types";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const QUICK_PROMPTS = [
  "How do I add a restaurant?",
  "How does the random picker work?",
  "How do I split a bill?",
  "What tabs are available?",
];

interface MatchRule {
  patterns: RegExp[];
  response: string | ((ctx: ChatContext) => string);
}

interface LastIntent {
  type: "count" | "list";
  cuisine?: string;
  neighborhood?: string;
  visited?: boolean;
  unvisited?: boolean;
  highRated?: boolean;
}

interface ChatContext {
  restaurants: Restaurant[];
  bills: Bill[];
  username: string;
  lastIntent: LastIntent | null;
  setLastIntent: (intent: LastIntent | null) => void;
}

const CUISINES_LIST = ["italian", "mexican", "japanese", "chinese", "indian", "thai", "american", "mediterranean", "korean", "vietnamese", "french", "ethiopian", "greek", "middle eastern", "bbq", "seafood", "pizza", "burgers"];
const NEIGHBORHOODS_LIST = ["ballard", "beacon hill", "bellevue", "belltown", "bothell", "capitol hill", "central district", "chinatown-id", "downtown", "fremont", "georgetown", "hillman city", "kirkland", "madison park", "pike place market", "pioneer square", "queen anne", "rainier valley", "south lake union", "tacoma", "university district", "wallingford", "white center", "woodinville"];

function formatResults(filtered: Restaurant[], desc: string, queryType: "count" | "list"): string {
  if (queryType === "count") {
    if (filtered.length === 0) {
      return "There are **no restaurants** matching " + desc + " in your list.";
    }
    return "There are **" + filtered.length + " restaurants** with " + desc + " in your list." + (filtered.length <= 8 ? "\n\n" + filtered.map((r) => "- " + r.name + (r.googleRating ? " (" + r.googleRating + " stars)" : "")).join("\n") : "\n\nHere are a few: " + filtered.slice(0, 5).map((r) => "**" + r.name + "**").join(", ") + (filtered.length > 5 ? ", and " + (filtered.length - 5) + " more." : "."));
  }

  if (filtered.length === 0) {
    return "I couldn't find any restaurants matching " + desc + ".";
  }
  const shown = filtered.slice(0, 10);
  let result = "Here are the " + desc + " restaurants (" + filtered.length + " total):\n\n";
  result += shown.map((r) => "- **" + r.name + "**" + (r.neighborhood ? " (" + r.neighborhood + ")" : "") + (r.googleRating ? " — " + r.googleRating + " stars" : "")).join("\n");
  if (filtered.length > 10) {
    result += "\n\n...and " + (filtered.length - 10) + " more. Check the Explore tab to see them all!";
  }
  return result;
}

function applyFilters(restaurants: Restaurant[], cuisine?: string, neighborhood?: string, visited?: boolean, unvisited?: boolean, highRated?: boolean): { filtered: Restaurant[]; description: string[] } {
  let filtered = [...restaurants];
  const description: string[] = [];

  if (cuisine) {
    filtered = filtered.filter((r) => r.cuisine.toLowerCase() === cuisine);
    description.push("**" + cuisine.charAt(0).toUpperCase() + cuisine.slice(1) + "** cuisine");
  }
  if (neighborhood) {
    filtered = filtered.filter((r) => r.neighborhood.toLowerCase() === neighborhood);
    description.push("in **" + neighborhood.charAt(0).toUpperCase() + neighborhood.slice(1) + "**");
  }
  if (unvisited) {
    filtered = filtered.filter((r) => !r.visited);
    description.push("not yet visited");
  } else if (visited) {
    filtered = filtered.filter((r) => r.visited);
    description.push("already visited");
  }
  if (highRated) {
    filtered = filtered.filter((r) => (r.googleRating || 0) >= 4);
    description.push("rated 4+ stars");
  }

  return { filtered, description };
}

function answerDataQuery(q: string, ctx: ChatContext): string | null {
  const { restaurants, lastIntent, setLastIntent } = ctx;

  const isCountQ = /how many|count|number of|total/i.test(q);
  const isListQ = /which|what are|show me|list|name/i.test(q);
  const isFollowUp = /what about|how about|and for|and what|same for/i.test(q);

  const matchedCuisine = CUISINES_LIST.find((c) => q.includes(c));
  const matchedNeighborhood = NEIGHBORHOODS_LIST.find((n) => q.includes(n));
  const isVisited = /visited|been to|tried|went/i.test(q);
  const isUnvisited = /not visited|haven.t tried|unvisited|not been|new/i.test(q);
  const isHighRated = /high.?rat|top.?rat|best|4\+|4 star|5 star|above 4/i.test(q);

  const hasFilter = !!(matchedCuisine || matchedNeighborhood || isVisited || isUnvisited || isHighRated);
  const hasExplicitIntent = isCountQ || isListQ;

  // Handle follow-up questions like "what about Japanese?" or just "Japanese?"
  if (!hasExplicitIntent && hasFilter && lastIntent) {
    const cuisine = matchedCuisine || lastIntent.cuisine;
    const neighborhood = matchedNeighborhood || (matchedCuisine ? undefined : lastIntent.neighborhood);
    const visited = isVisited || (!isUnvisited && !isVisited ? lastIntent.visited : false);
    const unvisited = isUnvisited || (!isVisited && !isUnvisited ? lastIntent.unvisited : false);
    const highRated = isHighRated || lastIntent.highRated;

    const newIntent: LastIntent = { type: lastIntent.type, cuisine, neighborhood, visited, unvisited, highRated };
    setLastIntent(newIntent);

    const { filtered, description } = applyFilters(restaurants, cuisine, neighborhood, visited, unvisited, highRated);
    return formatResults(filtered, description.join(", "), lastIntent.type);
  }

  // Handle follow-up with just a cuisine/neighborhood name (no "what about" prefix)
  if (!hasExplicitIntent && !isFollowUp && hasFilter && lastIntent) {
    const cuisine = matchedCuisine || lastIntent.cuisine;
    const neighborhood = matchedNeighborhood || lastIntent.neighborhood;
    const newIntent: LastIntent = { type: lastIntent.type, cuisine, neighborhood, visited: lastIntent.visited, unvisited: lastIntent.unvisited, highRated: lastIntent.highRated };
    setLastIntent(newIntent);

    const { filtered, description } = applyFilters(restaurants, cuisine, neighborhood, lastIntent.visited, lastIntent.unvisited, lastIntent.highRated);
    return formatResults(filtered, description.join(", "), lastIntent.type);
  }

  // Short follow-up that's just a cuisine or neighborhood name alone
  if (!hasExplicitIntent && !hasFilter && lastIntent) {
    const possibleCuisine = CUISINES_LIST.find((c) => q.replace(/[?.!,]/g, "").trim() === c || q.replace(/[?.!,]/g, "").trim() === c + "?");
    const possibleNeighborhood = NEIGHBORHOODS_LIST.find((n) => q.replace(/[?.!,]/g, "").trim() === n);
    if (possibleCuisine || possibleNeighborhood) {
      const cuisine = possibleCuisine || lastIntent.cuisine;
      const neighborhood = possibleNeighborhood || lastIntent.neighborhood;
      const newIntent: LastIntent = { ...lastIntent, cuisine, neighborhood };
      setLastIntent(newIntent);

      const { filtered, description } = applyFilters(restaurants, cuisine, neighborhood, lastIntent.visited, lastIntent.unvisited, lastIntent.highRated);
      return formatResults(filtered, description.join(", "), lastIntent.type);
    }
  }

  if (!hasExplicitIntent && !isFollowUp) return null;

  // Explicit new query
  if (!hasFilter) {
    if (isCountQ && /restaurant/i.test(q)) {
      setLastIntent({ type: "count" });
      return "You currently have **" + restaurants.length + " restaurants** in your list. You can browse them on the Explore tab!";
    }
    return null;
  }

  const queryType = isListQ ? "list" : "count";
  const newIntent: LastIntent = {
    type: queryType,
    cuisine: matchedCuisine,
    neighborhood: matchedNeighborhood,
    visited: isVisited,
    unvisited: isUnvisited,
    highRated: isHighRated,
  };
  setLastIntent(newIntent);

  const { filtered, description } = applyFilters(restaurants, matchedCuisine, matchedNeighborhood, isVisited, isUnvisited, isHighRated);
  return formatResults(filtered, description.join(", "), queryType);
}

function buildRules(ctx: ChatContext): MatchRule[] {
  const restaurantCount = ctx.restaurants.length;
  return [
    {
      patterns: [/^(hi|hello|hey|howdy|sup|yo)[\s!.?]*$/i, /\b(hi|hello|hey)\b.*\bhow are/],
      response: "Hey " + ctx.username + "! I'm your Friday Feast assistant. I can help you navigate the app, answer questions about features, or guide you through tasks. What would you like to know?",
    },
    {
      patterns: [/thank/, /thanks/, /thx/, /appreciate/],
      response: "You're welcome, " + ctx.username + "! Happy to help. Enjoy your next Friday Feast!",
    },
    {
      patterns: [/how many.*restaurant$/, /count.*restaurant$/, /total.*restaurant/, /number.*restaurant/],
      response: "You currently have **" + restaurantCount + " restaurants** in your list. You can browse them all on the Explore tab, filter by cuisine or neighborhood, or check the Map tab to see them on a map!",
    },
    {
      patterns: [/add.*restaurant/, /add.*place/, /new.*restaurant/, /new.*place/, /new.*spot/, /create.*restaurant/, /how.*add/],
      response: "To add a new restaurant:\n\n1. Click the **\"+ Add Restaurant\"** button in the top-right corner (visible on the Explore tab).\n2. Paste a **Google Maps link** to auto-fill the address, neighborhood, and other details.\n3. Fill in any remaining required fields (Address, Cuisine, Google Rating).\n4. Click **Save** — the restaurant will appear in the Explore tab!\n\nTip: The app will warn you if a restaurant with a similar name already exists.",
    },
    {
      patterns: [/random/, /picker/, /spin/, /wheel/, /pick.*for/, /choose.*for/, /can.t decide/, /surprise/, /pick.*tab/],
      response: "The **Random Picker** (Pick tab) helps your group choose a restaurant when you can't decide!\n\n1. Go to the **\"Pick\"** tab.\n2. Click **\"Spin the Wheel\"** — it randomly selects from all unvisited restaurants.\n3. The chosen restaurant is highlighted, and you can mark it as visited right from there.\n\nIt's a fun way to settle the weekly debate!",
    },
    {
      patterns: [/csv/, /upload.*bill/, /upload.*file/, /import/],
      response: "You can upload a CSV to populate a bill's split table:\n\n1. On any bill card, click **\"Upload CSV\"**.\n2. Select a .csv file from your computer.\n3. The file should have headers like: **Item, Ashrits, Banerjees, Joglekars, Iyers, Mehta, Mishras**.\n4. Each row becomes an item in the bill table with the amounts pre-filled.\n\nThis is great if you already have the bill broken down in a spreadsheet!",
    },
    {
      patterns: [/google sheet/, /spreadsheet/, /gsheet/],
      response: "You can link a Google Sheet when creating a bill:\n\n1. Click **\"Add Bill\"** on the Bill Pay tab.\n2. Paste a Google Sheet URL in the **\"Google Sheet Link\"** field.\n3. After creating the bill, the link will appear on the card so anyone can access the shared sheet.\n\nThis is useful for collaborative bill tracking outside the app!",
    },
    {
      patterns: [/bill/, /split/, /pay.*dinner/, /expense/, /owe/, /cost/, /divid/],
      response: "The **Bill Pay** tab helps you split dinner bills among families:\n\n1. Go to the **\"Bill Pay\"** tab and click **\"Add Bill\"**.\n2. Enter the restaurant name, date, and optionally a Google Sheet link.\n3. In the table, add items and enter each family's share.\n4. Tax and tip can be split per-family at the bottom.\n5. You can also **upload a CSV** to auto-populate the table.\n\nThe app calculates totals and each family's share automatically!",
    },
    {
      patterns: [/vote/, /voting/, /rank/, /favorite/, /prefer/],
      response: "The **Vote** tab lets your group vote on which restaurants to try next:\n\n1. Go to the **\"Vote\"** tab.\n2. Click the heart icon on any restaurant to cast your vote.\n3. Restaurants are ranked by total votes, so the group favorites rise to the top.\n\nThis helps prioritize which places to visit on upcoming Fridays!",
    },
    {
      patterns: [/visited/, /been.*before/, /went/, /tried/, /already.*ate/, /mark.*visit/],
      response: "The **Visited** tab tracks all restaurants your group has already tried:\n\n1. From any restaurant card, click **\"Mark Visited\"** in the detail view.\n2. Choose who visited and the date.\n3. You can also rate and leave review notes.\n\nVisited restaurants still appear on the Explore tab with a \"visited\" badge, so your full history is always visible.",
    },
    {
      patterns: [/map/, /location/, /direction/, /where.*is/],
      response: "The **Map** tab shows all restaurants on an interactive map:\n\n- Each pin represents a restaurant in your list.\n- **Hover** over a marker to see restaurant details (name, cuisine, rating).\n- Click the **map link** on any restaurant card to open it in Google Maps for directions.\n\nIt's great for visualizing which neighborhoods you haven't explored yet!",
    },
    {
      patterns: [/search/, /find.*restaurant/, /filter/, /look.*for/, /sort/],
      response: "You can search and filter restaurants on the **Explore** tab:\n\n- **Search bar**: Type a name (works with accents and fuzzy matching).\n- **Cuisine filter**: Click chips to filter by cuisine type.\n- **Neighborhood filter**: Filter by Seattle neighborhood.\n- **Rating filter**: Show only restaurants above a certain rating.\n- **Sort**: Toggle between rating, name, or date added.\n- **View**: Switch between card and list views.\n\nThe Bill Pay tab also has its own search bar for finding specific bills.",
    },
    {
      patterns: [/delete/, /remove/, /trash/, /get rid/],
      response: "To delete a restaurant or bill:\n\n- **Restaurant**: Hover over the card and click the trash icon. A confirmation dialog will ask you to confirm.\n- **Bill**: Hover over a bill card and click the trash icon. Same confirmation applies.\n\nDeletions are permanent, so the app always asks for confirmation first.",
    },
    {
      patterns: [/cuisine/, /food.*type/, /italian/, /thai/, /indian/, /japanese/, /mexican/, /chinese/, /korean/],
      response: "The app supports many cuisine types! You can filter by cuisine on the **Explore** tab using the filter chips at the top. Available cuisines include: American, BBQ, Chinese, Ethiopian, French, Greek, Indian, Italian, Japanese, Korean, Mediterranean, Mexican, Middle Eastern, Pizza, Seafood, Thai, Vietnamese, and more.\n\nWhen adding a restaurant, the cuisine is auto-detected from the Google Maps link when possible.",
    },
    {
      patterns: [/rating/, /star/, /review/, /score/],
      response: "Restaurants show their **Google Rating** (out of 5 stars) on each card. You can:\n\n- **Filter by rating** on the Explore tab using the rating chips.\n- **Sort by rating** to see the highest-rated restaurants first (this is the default).\n- **Add your own rating** when marking a restaurant as visited.\n\nRatings help your group prioritize the best spots!",
    },
    {
      patterns: [/explore/, /browse/, /see.*all/, /list.*restaurant/, /all.*restaurant/],
      response: "The **Explore** tab is your main restaurant directory:\n\n- See all " + restaurantCount + " restaurants in card or list view.\n- Search by name (accent-insensitive).\n- Filter by cuisine, neighborhood, or rating.\n- Sort by rating, name, or date added.\n- Click any card for full details, menu link, and map.\n\nVisited restaurants appear at the bottom with a badge showing who visited and when.",
    },
    {
      patterns: [/who/, /made/, /built/, /about.*app/, /member/, /group/, /friend/],
      response: "**Friday Feast** was built to help friend groups organize their weekly dinner outings! It tracks restaurants, manages votes, picks random spots, and even splits the bill. The group members are: Vivek, Garima, Veni, Suhel, Asmita, and Akshay.",
    },
    {
      patterns: [/tab/, /navigate/, /section/, /page/, /feature/, /what.*can/, /what.*do/, /how.*use/, /how.*work/, /help/, /overview/, /guide/, /what.*this/],
      response: "Friday Feast has 6 main tabs:\n\n1. **Explore** — Browse and search all restaurants, filter by cuisine/neighborhood/rating.\n2. **Vote** — Vote for your favorite restaurants to help the group decide.\n3. **Pick** — Use the random picker when you can't agree!\n4. **Visited** — See everywhere your group has already been.\n5. **Map** — View all restaurants on an interactive map.\n6. **Bill Pay** — Split the bill after each outing.\n\nYou can also add new restaurants, upload CSVs, and link Google Sheets!",
    },
    {
      patterns: [/neighborhood/, /area/, /seattle/, /near/],
      response: "You can filter restaurants by neighborhood on the **Explore** tab. Available neighborhoods include: Ballard, Beacon Hill, Bellevue, Belltown, Bothell, Capitol Hill, Chinatown-ID, Downtown, Fremont, Georgetown, Kirkland, Queen Anne, South Lake Union, University District, Wallingford, Woodinville, and more!\n\nThe Map tab also helps visualize which areas you've explored.",
    },
  ];
}

function generateResponse(query: string, context: ChatContext): string {
  const q = query.toLowerCase().trim();

  const dataAnswer = answerDataQuery(q, context);
  if (dataAnswer) return dataAnswer;

  const rules = buildRules(context);

  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      if (pattern.test(q)) {
        return typeof rule.response === "function" ? rule.response(context) : rule.response;
      }
    }
  }

  return "I'm not sure I understand that question, but here's what I can help with:\n\n- **Adding restaurants** — say \"how do I add a restaurant?\"\n- **Voting** — say \"how does voting work?\"\n- **Random Picker** — say \"pick a random restaurant\"\n- **Map** — say \"show me the map\"\n- **Bill splitting** — say \"how do I split a bill?\"\n- **Search & filters** — say \"how do I search?\"\n- **CSV upload** — say \"how do I upload a CSV?\"\n\nYou can also ask data questions like:\n- \"How many Indian restaurants are there?\"\n- \"Which restaurants in Bellevue have we visited?\"\n- \"List all top-rated Thai places\"\n\nOr ask **\"what can this app do?\"** for a full overview!";
}

export default function ChatWidget() {
  const { restaurants, bills, username } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `Hi ${username || "there"}! I'm your Friday Feast assistant. Ask me anything about the app — how to add restaurants, split bills, use the map, and more!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [lastIntent, setLastIntent] = useState<LastIntent | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: msg };
    const response = generateResponse(msg, {
      restaurants,
      bills,
      username: username || "Friend",
      lastIntent,
      setLastIntent,
    });
    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", text: response };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 ${
          isOpen ? "bg-gray-700 text-white" : "bg-brand-500 text-white"
        }`}
        title="Chat with Friday Feast AI"
      >
        {isOpen ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gray-100 bg-brand-500 px-4 py-3 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold">Friday Feast AI</h3>
              <p className="text-xs text-white/70">Ask me anything about the app</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-brand-500 text-white rounded-br-md"
                      : "bg-gray-100 text-gray-800 rounded-bl-md"
                  }`}
                >
                  <MessageContent text={msg.text} />
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="flex-1 rounded-xl border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-300 focus:bg-white"
                placeholder="Ask a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white transition-all hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MessageContent({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\`[^`]+\`|\n)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part === "\n") return <br key={i} />;
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} className="rounded bg-gray-200 px-1 py-0.5 text-xs font-mono">{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
