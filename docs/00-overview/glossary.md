# Glossary

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Status** | Active |
| **Owner** | Founder / Product |
| **Last Updated** | August 10, 2026 |
| **Related Documents** | [Vision](./vision.md) · [Product Positioning](./product-positioning.md) · [Lean Canvas](./lean-canvas.md) · [Roadmap](./roadmap.md) |

---

Shared vocabulary for Seloma. Definitions reflect how we use each term in the product — not generic industry textbook meanings.

**Audience:** Developers, product managers, designers, business team, investors.

**Identity:** See [Product Positioning](./product-positioning.md) — storefront + unified ops first; AI Employee as add-on.

---

## Native Storefront / سایت‌ساز

The Digikala-like public shop (`apps/storefront`) plus Workspace CMS where merchants manage products, categories, appearance, and COD orders.

This is the **primary commercial product**. A merchant who never enables AI still gets a coherent shop and order hub.

**Example:** A shop publishes products in Workspace, opens `/s/{slug}` for customers, and manages incoming COD orders in one place.

---

## Unified commerce ops

The product job of keeping **catalog, inventory, orders, and channel conversations** coherent in one Workspace so the shop manager is not lost across tools.

**Example:** An order started from a Telegram product link appears beside website COD orders with the same stock truth.

---

## AI Employee

A specialized AI agent configured to perform a commerce role for a merchant — such as Sales, Support, Marketing, or Analytics.

AI Employees are an **optional paid offer** on top of the shop platform: a virtual team member that sells, supports, and learns from customer conversations. They are opinionated and commerce-focused, not general-purpose chatbots.

**Example:** A merchant who already runs Seloma storefront enables an AI Sales Employee on web chat and Telegram. It answers product questions from the live catalog and escalates refunds to a human.

---

## Agent

The runtime unit that receives a customer message, pulls business context, calls tools (catalog lookup, order status), and generates a response within merchant guardrails.

An Agent is the technical building block behind an AI Employee. It has a goal, allowed actions, escalation rules, and access to the Knowledge Base and Commerce Core.

**Example:** The Sales Agent checks inventory before recommending a size, applies the merchant's discount limit, and routes low-confidence answers to Human Handoff.

---

## Workspace

The merchant's home inside Seloma AI — where they connect their store, configure agents, manage channels, review conversations, and view performance.

One Workspace typically maps to one online business (one store, one brand). Team members log in here to operate the platform day to day.

**Example:** A shop owner opens their Workspace to update return policy text, enable the Bale channel, and review yesterday's escalated conversations.

---

## Tenant

The isolated data and configuration boundary for a single merchant account in Seloma AI's multi-tenant architecture.

Each Tenant's catalog sync, conversations, customer profiles, and analytics are kept separate from other merchants. The runtime is shared; the data is not.

**Example:** Shop A and Shop B both use Seloma AI on the same infrastructure, but Shop A's order data never appears in Shop B's agent context.

---

## Channel

A customer-facing surface where conversations happen — web chat, Telegram, Bale, WhatsApp, Instagram DMs, email, or SMS.

In Seloma AI, channels are where shoppers already talk to the business. The same Agent logic runs across channels; only formatting and delivery differ.

**Example:** A customer asks about shipping on the website widget at noon and follows up on Telegram at midnight. Both messages belong to the same business and can share one Customer Profile.

---

## Channel Adapter

The connector that translates between Seloma AI and a specific channel's API, message format, and delivery rules.

Adapters handle inbound messages (customer → platform), outbound replies (platform → customer), and channel-specific constraints such as message length, rich media, and bot authentication.

**Example:** The Telegram Channel Adapter receives a `/start` command and a product photo, normalizes them into a standard Conversation event, and sends the Agent's reply back as a Telegram message.

---

## Conversation

A thread of messages between a customer and the business on one Channel — handled by an Agent, a human, or both.

Conversations are the primary unit of work and revenue attribution in Seloma AI. They carry full context: customer identity, channel, history, and any commerce actions taken (recommendation shown, cart link sent, escalation triggered).

**Example:** A 12-message thread where a shopper asks about laptop compatibility, receives two product recommendations, and completes a purchase — counted as one Conversation with an attributed conversion.

---

## Context Engine

The layer that assembles everything an Agent needs to answer accurately before each reply: live catalog and inventory, order history, policies, Knowledge Base retrieval results, and the current Conversation history.

Context beats clever prompts in Seloma AI. The Context Engine is what makes responses reflect what the merchant actually sells and promises — not generic model knowledge.

**Example:** When a customer asks "Can I return this if it doesn't fit?", the Context Engine pulls the merchant's return policy, the product's category rules, and whether the customer has prior orders — then passes that bundle to the Agent.

---

## Knowledge Base

The merchant's structured and unstructured business knowledge that Agents can search and cite — synced catalog data, shipping and return policies, manual FAQs, and uploaded documents (PDFs, brand guides).

The Knowledge Base is kept in sync with the storefront where possible and supplemented by merchant overrides for edge cases.

**Example:** A merchant uploads a sizing chart PDF and adds a FAQ about custom engraving. Both are indexed so the Agent can answer sizing and customization questions without hallucinating.

---

## RAG

Retrieval-Augmented Generation — the pattern Seloma AI uses to ground Agent replies in real merchant data instead of the model's general training.

Before generating an answer, the system retrieves relevant chunks from the Knowledge Base (and Commerce Core where needed), then the model responds using that retrieved context.

**Example:** A customer asks "Do you ship to Shiraz?" The system retrieves the merchant's shipping zones document and the Agent answers with the actual delivery options and cost — not a guess.

---

## Vector Database

The store that holds Embeddings for Knowledge Base content, enabling semantic search ("find passages similar in meaning to this question") rather than keyword-only matching.

Used by RAG to fetch the most relevant policies, product descriptions, and FAQ entries for each customer message.

**Example:** A shopper writes "my package hasn't arrived yet" — semantic search matches return and tracking policy sections even though the word "return" was not used.

---

## Embedding

A numerical representation of text that captures meaning, so similar questions and documents sit close together in search space.

Seloma AI generates Embeddings for Knowledge Base entries and uses them at query time to find the best sources for RAG.

**Example:** "Where is my order?" and "tracking status for purchase" produce similar Embeddings and retrieve the same order-tracking FAQ.

---

## Customer Profile

A unified record of one shopper across Channels — identity (where known), conversation history, order history, and inferred preferences or objections.

Omnichannel depends on Customer Profile: the Agent should not ask the customer to repeat themselves when they switch from web chat to Telegram.

**Example:** A customer chats on the website about a jacket, then messages on Bale two days later. The Agent sees prior interest, past orders, and open questions in one Customer Profile.

---

## Product Intelligence

Structured insight extracted from Conversations about products and purchase behavior — top objections, confusing listings, demand signals, and pre-purchase friction — surfaced to merchants automatically.

Product Intelligence turns chat logs into commerce decisions. It is a core outcome of Seloma AI, not a separate BI tool.

**Example:** The dashboard shows that 40% of pre-purchase questions this week mention "battery life" for a specific SKU — prompting the merchant to update the product page or train the Agent with clearer specs.

---

## Human Handoff

The controlled transfer of a Conversation from an Agent to a human team member, with full context preserved.

Handoff is first-class in Seloma AI — triggered by low confidence, merchant policy (refunds, complaints), customer request, or business-hours rules. Merchants stay in control; autonomy is earned.

**Example:** The Agent starts a return for a high-value order, hits the "manager approval required" rule, and Handoff assigns the thread to support with the customer's order details and chat summary already attached.

---

## Omnichannel

Operating one Agent layer across multiple Channels with unified Customer Profile, conversation memory, and merchant rules — so behavior stays consistent whether the customer uses web chat, Telegram, or Bale.

Formatting adapts per channel; business logic and context do not.

**Example:** Discount limits, tone, and product recommendations are identical on the website widget and Telegram bot. The customer gets the same accurate answers on either surface.

---

## Commerce Core

Seloma AI's integration layer to the merchant's commerce stack — catalog, inventory, cart, checkout, and orders.

Without Commerce Core, Seloma AI would be a generic chatbot. With it, Agents act on live business data: real prices, stock levels, and order status.

**Example:** Commerce Core syncs from Shopify every hour. When a customer asks if the blue hoodie is in stock, the Agent reads current inventory from Commerce Core — not yesterday's spreadsheet.

---

## Event

A structured signal emitted by the platform when something meaningful happens — for internal processing, webhooks, analytics, or Automations.

Events make the system observable and extensible. Merchants and integrators subscribe to them instead of polling.

**Example:** `conversation.escalated`, `conversion.attributed`, `cart.abandoned`, and `store.sync_failed` are Events that can trigger dashboards, alerts, or downstream Workflows.

---

## Workflow

A defined sequence of steps and rules that govern how Conversations and Events are handled — escalation paths, approval chains, routing by channel or business hours, and multi-step commerce actions.

Workflows encode merchant policy in the platform. They sit between raw Agent capability and day-to-day operations.

**Example:** A Workflow specifies: if the message mentions "legal" or "lawyer", skip the Agent and route directly to Human Handoff; if outside business hours, collect contact info and promise a reply by 9 AM.

---

## Automation

Proactive or triggered actions initiated by Seloma AI without a customer typing first — always within merchant-defined guardrails.

Automations focus on revenue and efficiency: recovering abandoned carts, follow-ups, win-back messages, and scheduled routing. They are introduced after core Agent quality is proven.

**Example:** An abandoned-cart Automation sends a Telegram message two hours after checkout drop-off, answers a product objection if the customer replies, and attributes any completed purchase to the Automation in the dashboard.

---

## Quick reference

| Term | One-line summary |
|------|------------------|
| **AI Employee** | Commerce role the merchant hires (Sales, Support, etc.) |
| **Agent** | Runtime that handles messages with tools and guardrails |
| **Workspace** | Merchant's operational home in Seloma AI |
| **Tenant** | Isolated merchant boundary in multi-tenant architecture |
| **Channel** | Where customers talk (web, Telegram, Bale, …) |
| **Channel Adapter** | Connector between Seloma AI and a channel's API |
| **Conversation** | Message thread between customer and business |
| **Context Engine** | Assembles live business context before each reply |
| **Knowledge Base** | Searchable merchant knowledge Agents retrieve from |
| **RAG** | Retrieve merchant data, then generate the answer |
| **Vector Database** | Semantic search store for Knowledge Base content |
| **Embedding** | Meaning-based numeric representation of text |
| **Customer Profile** | Unified shopper record across channels |
| **Product Intelligence** | Conversation-derived product and demand insights |
| **Human Handoff** | Agent-to-human transfer with full context |
| **Omnichannel** | One brain, many channels, shared memory |
| **Commerce Core** | Live catalog, cart, and order integration |
| **Event** | Platform signal for analytics, webhooks, automations |
| **Workflow** | Rules and steps for routing and handling work |
| **Automation** | Proactive actions within merchant guardrails |
