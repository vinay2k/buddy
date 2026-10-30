
import { useState, useEffect } from "react";

import {
  Menu,
  Plus,
  MessageSquare,
  Code2,
  ShieldCheck,
  Image,
  Folder,
  Brain,
  Settings,
  UserCircle,
  Paperclip,
  Mic,
  ArrowUp,
  Sparkles,
  PanelLeftClose,
  Trash2,
  Bot,
  ChevronDown,
  Zap,
  Sun,
  Moon,
  Lock,
  RotateCcw,
} from "lucide-react";

import "./style.css";

// ============================================
// CONFIGURATION
// ============================================

const API_URL =
  "https://backend.nookalasaivinay2k2.workers.dev/api/chat";

const STORAGE_KEYS = {
  chats: "vinay-ai-chats",
  theme: "vinay-ai-theme",
  model: "vinay-ai-model",
};

// Only this model is currently connected.
const models = [
  {
    name: "Llama 3.1",
    provider: "Cloudflare Workers AI",
    tag: "Connected",
  },
];

// ============================================
// WORKSPACE TOOLS
// ============================================

const tools = [
  {
    title: "Code Assistant",
    description: "Write, debug and understand code",
    icon: Code2,
    color: "purple",
    prompt: "Help me write and debug code",
  },
  {
    title: "Cybersecurity",
    description: "Learn security and analyze threats",
    icon: ShieldCheck,
    color: "green",
    prompt: "Teach me a cybersecurity concept",
  },
  {
    title: "Documents",
    description: "Analyze and summarize documents",
    icon: Folder,
    color: "yellow",
    prompt: "I want to analyze a document",
  },
  {
    title: "Image Studio",
    description: "Create and explore visual ideas",
    icon: Image,
    color: "pink",
    prompt: "Help me create an image",
  },
];

// ============================================
// STORAGE HELPERS
// ============================================

function getSavedChats() {
  try {
    return (
      JSON.parse(localStorage.getItem(STORAGE_KEYS.chats)) || []
    );
  } catch {
    return [];
  }
}

function getSavedTheme() {
  return localStorage.getItem(STORAGE_KEYS.theme) || "dark";
}

function getSavedModel() {
  return localStorage.getItem(STORAGE_KEYS.model) || "Llama 3.1";
}

// ============================================
// MAIN APPLICATION
// ============================================

export default function App() {

  // ==========================================
  // STATE
  // ==========================================

  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.innerWidth > 800
  );

  const [message, setMessage] = useState("");

  const [activeTool, setActiveTool] = useState("Chat");

  const [chatStarted, setChatStarted] = useState(false);

  const [chats, setChats] = useState(getSavedChats);

  const [activeChatId, setActiveChatId] = useState(null);

  const [selectedModel, setSelectedModel] = useState(
    getSavedModel
  );

  const [modelMenuOpen, setModelMenuOpen] = useState(false);

  const [theme, setTheme] = useState(getSavedTheme);

  const [isLoading, setIsLoading] = useState(false);

  const [apiError, setApiError] = useState("");

  // ==========================================
  // ACTIVE CHAT
  // ==========================================

  const activeChat = chats.find(
    (chat) => chat.id === activeChatId
  );

  const messages = activeChat?.messages || [];

  // ==========================================
  // SAVE DATA
  // ==========================================

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.chats,
      JSON.stringify(chats)
    );
  }, [chats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.model, selectedModel);
  }, [selectedModel]);

  // ==========================================
  // RESPONSIVE SIDEBAR
  // ==========================================

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= 800) {
        setSidebarOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function closeMobileSidebar() {
    if (window.matchMedia("(max-width: 800px)").matches) {
      setSidebarOpen(false);
    }
  }

  // ==========================================
  // CHAT MANAGEMENT
  // ==========================================

  function startNewChat() {
    setActiveChatId(null);
    setMessage("");
    setChatStarted(false);
    setActiveTool("Chat");
    setModelMenuOpen(false);
    setApiError("");

    closeMobileSidebar();
  }

  function selectChat(id) {
    setActiveChatId(id);
    setChatStarted(true);
    setActiveTool("Chat");
    setApiError("");

    closeMobileSidebar();
  }

  function deleteChat(id, event) {
    event.stopPropagation();

    setChats((previous) =>
      previous.filter((chat) => chat.id !== id)
    );

    if (activeChatId === id) {
      startNewChat();
    }
  }

  function clearChatHistory() {
    const confirmed = window.confirm(
      "Are you sure you want to delete all conversations?"
    );

    if (confirmed) {
      setChats([]);
      setActiveChatId(null);
      setChatStarted(false);
      setApiError("");
      setActiveTool("Settings");
    }
  }

  // ==========================================
  // SEND MESSAGE TO CLOUDFLARE AI
  // ==========================================

  async function sendMessage(value = message) {
    const text = value.trim();

    if (!text || isLoading) return;

    setApiError("");
    setIsLoading(true);
    setMessage("");
    setChatStarted(true);
    setActiveTool("Chat");
    setModelMenuOpen(false);

    const chatId = activeChatId || Date.now();

    const existingMessages = activeChatId
      ? activeChat?.messages || []
      : [];

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    const conversationMessages = [
      ...existingMessages,
      userMessage,
    ];

    // Create a new conversation.
    if (!activeChatId) {
      setActiveChatId(chatId);

      setChats((previous) => [
        {
          id: chatId,
          title:
            text.length > 35
              ? text.slice(0, 35) + "..."
              : text,
          messages: conversationMessages,
          model: selectedModel,
          createdAt: new Date().toISOString(),
        },
        ...previous,
      ]);
    } else {
      // Update existing conversation.
      setChats((previous) =>
        previous.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: conversationMessages,
              }
            : chat
        )
      );
    }

    try {
      // Authentication will be handled by the
      // Cloudflare Access integration.
      const response = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          messages: conversationMessages
            .slice(-20)
            .map(({ role, content }) => ({
              role,
              content,
            })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to get AI response."
        );
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          data.reply ||
          "The AI returned an empty response.",
      };

      // Save AI response.
      setChats((previous) =>
        previous.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  assistantMessage,
                ],
              }
            : chat
        )
      );

    } catch (error) {
      console.error("Chat error:", error);
      setApiError(error.message);

    } finally {
      setIsLoading(false);
    }
  }

  // ==========================================
  // TOOL MANAGEMENT
  // ==========================================

  function selectTool(tool) {
    startNewChat();
    setActiveTool(tool);
  }

  function openSettings() {
    setActiveTool("Settings");
    setApiError("");

    closeMobileSidebar();
  }

  // ==========================================
  // APPLICATION UI
  // ==========================================

  return (
    <div className={`app ${theme === "light" ? "theme-light" : ""}`}>

      {/* SIDEBAR */}

      <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>

        <div className="sidebar-top">

          <div className="brand">

            <div className="brand-logo">
              <Sparkles size={22} />
            </div>

            {sidebarOpen && (
              <div className="brand-name">
                <h2>VINAY AI</h2>
                <span>Personal Intelligence</span>
              </div>
            )}

          </div>

          <button
            className="icon-button sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle sidebar"
          >
            <PanelLeftClose />
          </button>

        </div>

        <button
          className="new-chat"
          onClick={startNewChat}
        >
          <Plus size={19} />
          {sidebarOpen && <span>New chat</span>}
        </button>

        <div className="sidebar-section">

          {sidebarOpen && (
            <p className="section-label">WORKSPACE</p>
          )}

          <button
            className={`nav-item ${activeTool === "Chat" ? "active" : ""}`}
            onClick={() => selectTool("Chat")}
          >
            <MessageSquare size={19} />
            {sidebarOpen && <span>Chats</span>}
          </button>

          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <button
                key={tool.title}
                className={`nav-item ${
                  activeTool === tool.title ? "active" : ""
                }`}
                onClick={() => selectTool(tool.title)}
              >
                <Icon size={19} />
                {sidebarOpen && <span>{tool.title}</span>}
              </button>
            );
          })}

          <button
            className={`nav-item ${
              activeTool === "Memory" ? "active" : ""
            }`}
            onClick={() => selectTool("Memory")}
          >
            <Brain size={19} />
            {sidebarOpen && <span>Memory</span>}
          </button>

        </div>

        {/* RECENT CHATS */}

        {sidebarOpen && (
          <div className="recent-section">

            <p className="section-label">RECENT CHATS</p>

            {chats.length === 0 ? (
              <p className="empty-history">
                No conversations yet
              </p>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`recent-item ${
                    activeChatId === chat.id ? "selected" : ""
                  }`}
                  onClick={() => selectChat(chat.id)}
                >
                  <MessageSquare size={15} />

                  <span>{chat.title}</span>

                  <button
                    className="delete-chat"
                    onClick={(event) => deleteChat(chat.id, event)}
                    title="Delete chat"
                  >
                    <Trash2 size={14} />
                  </button>

                </div>
              ))
            )}

          </div>
        )}

        {/* SIDEBAR BOTTOM */}

        <div className="sidebar-bottom">

          <button
            className={`nav-item ${
              activeTool === "Settings" ? "active" : ""
            }`}
            onClick={openSettings}
          >
            <Settings size={19} />
            {sidebarOpen && <span>Settings</span>}
          </button>

          <div className="profile">

            <div className="profile-avatar">
              <UserCircle size={23} />
            </div>

            {sidebarOpen && (
              <div className="profile-info">
                <strong>Vinay</strong>
                <span>Personal account</span>
              </div>
            )}

          </div>

        </div>

      </aside>

      {/* MOBILE BACKDROP */}

      <button
        className={`sidebar-backdrop ${sidebarOpen ? "visible" : ""}`}
        aria-label="Close navigation menu"
        onClick={() => setSidebarOpen(false)}
      />

      {/* MAIN CONTENT */}

      <main className="main-content">

        {/* TOPBAR */}

        <header className="topbar">

          <div className="mobile-brand">

            <button
              className="icon-button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu />
            </button>

            <strong>VINAY AI</strong>

          </div>

          <div className="topbar-left">

            <span className="workspace-name">
              {activeTool === "Settings"
                ? "Settings"
                : activeChat?.title || activeTool}
            </span>

            <span className="private-label">
              <span className="status-dot"></span>
              Private workspace
            </span>

          </div>

          <button
            className="icon-button"
            onClick={openSettings}
            title="Settings"
          >
            <Settings size={19} />
          </button>

        </header>

        {/* CHAT AREA */}

        <div className="chat-area">

          {/* SETTINGS */}

          {activeTool === "Settings" ? (

            <section className="settings-page">

              <div className="settings-heading">

                <div className="welcome-icon">
                  <Settings size={25} />
                </div>

                <h1>Settings</h1>

                <p>
                  Manage your Vinay AI workspace and preferences.
                </p>

              </div>

              <div className="settings-content">

                {/* APPEARANCE */}

                <div className="settings-card">

                  <div className="settings-card-heading">
                    <Sun size={20} />

                    <div>
                      <h3>Appearance</h3>
                      <p>Choose how Vinay AI looks.</p>
                    </div>
                  </div>

                  <div className="theme-options">

                    <button
                      className={`theme-option ${
                        theme === "dark" ? "selected" : ""
                      }`}
                      onClick={() => setTheme("dark")}
                    >
                      <Moon size={20} />
                      <span>Dark mode</span>
                    </button>

                    <button
                      className={`theme-option ${
                        theme === "light" ? "selected" : ""
                      }`}
                      onClick={() => setTheme("light")}
                    >
                      <Sun size={20} />
                      <span>Light mode</span>
                    </button>

                  </div>

                </div>

                {/* MODEL */}

                <div className="settings-card">

                  <div className="settings-card-heading">
                    <Bot size={20} />

                    <div>
                      <h3>Default AI model</h3>
                      <p>
                        The model currently connected to your backend.
                      </p>
                    </div>
                  </div>

                  <div className="settings-models">

                    {models.map((model) => (
                      <button
                        key={model.name}
                        className={`settings-model-option ${
                          selectedModel === model.name ? "selected" : ""
                        }`}
                        onClick={() => setSelectedModel(model.name)}
                      >
                        <div>
                          <strong>{model.name}</strong>
                          <span>{model.provider}</span>
                        </div>

                        <small>
                          {selectedModel === model.name
                            ? "Selected"
                            : model.tag}
                        </small>
                      </button>
                    ))}

                  </div>

                </div>

                {/* CHAT HISTORY */}

                <div className="settings-card">

                  <div className="settings-card-heading">
                    <MessageSquare size={20} />

                    <div>
                      <h3>Chat history</h3>
                      <p>
                        Conversations are saved in this browser's local storage.
                      </p>
                    </div>
                  </div>

                  <div className="settings-action-row">

                    <div>
                      <strong>Delete all conversations</strong>
                      <p>
                        This permanently clears your saved chat history.
                      </p>
                    </div>

                    <button
                      className="danger-button"
                      onClick={clearChatHistory}
                    >
                      <Trash2 size={16} />
                      Clear history
                    </button>

                  </div>

                </div>

                {/* PRIVACY */}

                <div className="settings-card">

                  <div className="settings-card-heading">
                    <Lock size={20} />

                    <div>
                      <h3>Privacy and security</h3>
                      <p>
                        Information about your current workspace.
                      </p>
                    </div>
                  </div>

                  <div className="privacy-info">

                    <div>
                      <strong>Chat storage</strong>
                      <span>Browser local storage</span>
                    </div>

                    <div>
                      <strong>Cloud AI connection</strong>
                      <span>Cloudflare Workers AI</span>
                    </div>

                    <div>
                      <strong>API authentication</strong>
                      <span>Security upgrade in progress</span>
                    </div>

                  </div>

                </div>

                {/* ABOUT */}

                <div className="settings-card about-card">

                  <div className="settings-card-heading">
                    <Sparkles size={20} />

                    <div>
                      <h3>About Vinay AI</h3>
                      <p>Your personal AI workspace.</p>
                    </div>
                  </div>

                  <div className="about-details">
                    <span>Application</span>
                    <strong>VINAY AI</strong>

                    <span>Version</span>
                    <strong>0.2.0 — Cloud AI connected</strong>
                  </div>

                </div>

              </div>

            </section>

          ) : !chatStarted ? (

            /* WELCOME SCREEN */

            <section className="welcome-screen">

              <div className="welcome-icon">
                <Sparkles size={30} />
              </div>

              <h1>
                Hey, Vinay<span>.</span>
              </h1>

              <p className="welcome-description">
                What are we building today?
              </p>

              <div className="tool-grid">

                {tools.map((tool) => {
                  const Icon = tool.icon;

                  return (
                    <button
                      className="tool-card"
                      key={tool.title}
                      onClick={() => {
                        setActiveTool(tool.title);
                        setMessage(tool.prompt);
                      }}
                    >
                      <div className={`tool-icon ${tool.color}`}>
                        <Icon size={21} />
                      </div>

                      <div className="tool-text">
                        <h3>{tool.title}</h3>
                        <p>{tool.description}</p>
                      </div>

                    </button>
                  );
                })}

              </div>

            </section>

          ) : (

            /* CONVERSATION */

            <section className="conversation">

              {messages.map((msg) => (
                <div
                  className={`message ${msg.role}`}
                  key={msg.id}
                >
                  <div className="message-avatar">

                    {msg.role === "user" ? (
                      <UserCircle size={20} />
                    ) : (
                      <Bot size={20} />
                    )}

                  </div>

                  <div className="message-content">

                    <strong>
                      {msg.role === "user" ? "You" : "Vinay AI"}
                    </strong>

                    <p>{msg.content}</p>

                  </div>

                </div>
              ))}

              {/* LOADING */}

              {isLoading && (
                <div className="message assistant">

                  <div className="message-avatar">
                    <Bot size={20} />
                  </div>

                  <div className="message-content">
                    <strong>Vinay AI</strong>
                    <p>Thinking...</p>
                  </div>

                </div>
              )}

              {/* API ERROR */}

              {apiError && (
                <div className="demo-notice">
                  <Bot size={17} />
                  {apiError}
                </div>
              )}

            </section>

          )}

          {/* CHAT INPUT */}

          {activeTool !== "Settings" && (

            <div className="input-section">

              <div className="chat-input-box">

                <textarea
                  placeholder="Ask Vinay AI anything..."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !isLoading
                    ) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  rows={2}
                  disabled={isLoading}
                />

                <div className="input-actions">

                  <div className="input-left">

                    <button
                      className="input-icon"
                      title="Attach file"
                      disabled
                    >
                      <Paperclip size={19} />
                    </button>

                    {/* MODEL SELECTOR */}

                    <div className="model-selector">

                      <button
                        className="model-trigger"
                        onClick={() => setModelMenuOpen(!modelMenuOpen)}
                      >
                        <Zap size={14} />
                        {selectedModel}
                        <ChevronDown size={14} />
                      </button>

                      {modelMenuOpen && (

                        <div className="model-dropdown">

                          <p className="dropdown-heading">
                            CONNECTED AI MODEL
                          </p>

                          {models.map((model) => (
                            <button
                              key={model.name}
                              className={`model-option ${
                                selectedModel === model.name ? "selected" : ""
                              }`}
                              onClick={() => {
                                setSelectedModel(model.name);
                                setModelMenuOpen(false);
                              }}
                            >
                              <div>
                                <strong>{model.name}</strong>
                                <span>{model.provider}</span>
                              </div>

                              <small>{model.tag}</small>
                            </button>
                          ))}

                        </div>

                      )}

                    </div>

                  </div>

                  <div className="input-right">

                    <button
                      className="input-icon"
                      title="Voice input (coming soon)"
                      disabled
                    >
                      <Mic size={19} />
                    </button>

                    <button
                      className="send-button"
                      onClick={() => sendMessage()}
                      disabled={!message.trim() || isLoading}
                      title="Send message"
                    >
                      {isLoading ? (
                        <RotateCcw size={20} />
                      ) : (
                        <ArrowUp size={20} />
                      )}
                    </button>

                  </div>

                </div>

              </div>

              <p className="input-disclaimer">
                Vinay AI can make mistakes. Verify important information.
              </p>

            </div>

          )}

        </div>

      </main>

    </div>
  );
}
