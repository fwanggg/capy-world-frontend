export default function UseCases() {
  return (
    <div>
      <section
        style={{
          padding: "var(--space-4xl) var(--space-xl)",
          backgroundColor: "var(--color-gray-50)",
        }}
      >
        <div className="container" style={{ maxWidth: "720px" }}>
          <h1
            style={{
              marginBottom: "var(--space-base)",
              fontSize: "var(--text-xl)",
              fontWeight: 600,
              color: "var(--color-navy)",
            }}
          >
            Use Cases
          </h1>
          <p
            style={{
              fontSize: "var(--text-sm)",
              lineHeight: 1.7,
              color: "var(--color-gray-600)",
            }}
          >
            How to use Capysan for early-stage idea validation.
          </p>
        </div>
      </section>

      <section style={{ padding: "var(--space-4xl) var(--space-xl)" }}>
        <div className="container" style={{ maxWidth: "720px" }}>
          <h2
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: 600,
              color: "var(--color-navy)",
              marginBottom: "var(--space-base)",
            }}
          >
            Early Stage Idea Validation
          </h2>
          <p
            style={{
              fontSize: "var(--text-sm)",
              lineHeight: 1.7,
              color: "var(--color-gray-600)",
              marginBottom: "var(--space-2xl)",
            }}
          >
            Validate your assumptions with ICP-matched AI personas. Organize research in <strong>studyrooms</strong>, each with its own chat and personas. Ask questions, test pitches, and get unfiltered feedback—no scheduling, no surveys, no BS.
          </p>

          {/* Message routing */}
          <div
            style={{
              padding: "var(--space-lg)",
              background: "var(--color-navy)",
              color: "var(--color-white)",
              borderRadius: "0.5rem",
              marginBottom: "var(--space-3xl)",
              fontSize: "var(--text-sm)",
              lineHeight: 1.7,
            }}
          >
            <strong style={{ display: "block", marginBottom: "var(--space-sm)" }}>Message routing</strong>
            Use <code style={{ background: "rgba(255,255,255,0.2)", padding: "0 4px", borderRadius: "2px" }}>@mention</code> at the start of your message to control who receives it:
            <ul style={{ margin: "var(--space-base) 0 0", paddingLeft: "var(--space-lg)" }}>
              <li><strong>@capysan</strong> — Sends to Capysan (orchestrator). Use for: recruiting, synthesis, release, or any request that needs Capysan’s tools.</li>
              <li><strong>@all_participants</strong> — Sends to all active personas at once. Use for: validation questions, surveys, pitch testing. Each persona replies individually.</li>
              <li><strong>@[persona_id]</strong> — Sends to one specific persona (e.g. <code style={{ background: "rgba(255,255,255,0.2)", padding: "0 2px", borderRadius: "2px" }}>@A1B2C3</code>).</li>
              <li><strong>No mention</strong> — Defaults to Capysan. Safe when you want to recruit, summarize, or talk to the orchestrator.</li>
            </ul>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3xl)" }}>
            {/* Step 0 */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-base)",
                  marginBottom: "var(--space-base)",
                }}
              >
                <span
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-teal)",
                    color: "var(--color-white)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  1
                </span>
                <h3
                  style={{
                    fontSize: "var(--text-base)",
                    fontWeight: 600,
                    color: "var(--color-navy)",
                  }}
                >
                  Create or select a studyroom
                </h3>
              </div>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-gray-600)", lineHeight: 1.7, marginBottom: "var(--space-base)" }}>
                <strong>What you do:</strong> A studyroom is a research project. Each room has its own chat history and persona group. Create one per idea, segment, or hypothesis you’re validating.
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-gray-600)", lineHeight: 1.7, marginBottom: "var(--space-base)" }}>
                <strong>What Capysan does:</strong> The Studyrooms sidebar lists your rooms. Switch between them to work on different projects. Each room keeps its own conversation and recruited personas.
              </p>
              <div
                style={{
                  padding: "var(--space-base)",
                  background: "var(--color-gray-50)",
                  border: "1px solid var(--color-gray-200)",
                  borderRadius: "0.5rem",
                  fontSize: "var(--text-sm)",
                  fontFamily: "monospace",
                }}
              >
                <strong>How to:</strong> Click <strong>+</strong> in the Studyrooms sidebar to create a new room. Click a room name to switch. Rename or delete from the sidebar.
              </div>
            </div>

            {/* Step 1 */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-base)",
                  marginBottom: "var(--space-base)",
                }}
              >
                <span
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-teal)",
                    color: "var(--color-white)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  2
                </span>
                <h3
                  style={{
                    fontSize: "var(--text-base)",
                    fontWeight: 600,
                    color: "var(--color-navy)",
                  }}
                >
                  Recruit personas
                </h3>
              </div>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-gray-600)", lineHeight: 1.7, marginBottom: "var(--space-base)" }}>
                <strong>What you do:</strong> Describe your target audience in plain language. Capysan finds and activates personas that match.
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-gray-600)", lineHeight: 1.7, marginBottom: "var(--space-base)" }}>
                <strong>Who to mention:</strong> No mention, or <code style={{ background: "var(--color-gray-200)", padding: "0 4px", borderRadius: "2px" }}>@capysan</code>. Messages without a mention default to Capysan, who handles recruiting.
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-gray-600)", lineHeight: 1.7, marginBottom: "var(--space-base)" }}>
                <strong>What Capysan does:</strong> Searches by demographics (age, location, profession) or semantic intent (e.g. “used carpooling to ski resort”). Activates personas and shows them in the Participants sidebar for that studyroom.
              </p>
              <div
                style={{
                  padding: "var(--space-base)",
                  background: "var(--color-gray-50)",
                  border: "1px solid var(--color-gray-200)",
                  borderRadius: "0.5rem",
                  fontSize: "var(--text-sm)",
                  fontFamily: "monospace",
                }}
              >
                <strong>How to:</strong> Type in chat, e.g. “get me 10 personas in the US who used carpooling to get to a ski resort”
              </div>
            </div>

            {/* Step 2 */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-base)",
                  marginBottom: "var(--space-base)",
                }}
              >
                <span
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-teal)",
                    color: "var(--color-white)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  3
                </span>
                <h3
                  style={{
                    fontSize: "var(--text-base)",
                    fontWeight: 600,
                    color: "var(--color-navy)",
                  }}
                >
                  Ask validation questions
                </h3>
              </div>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-gray-600)", lineHeight: 1.7, marginBottom: "var(--space-base)" }}>
                <strong>What you do:</strong> Ask questions to validate pain points, test assumptions, or gather opinions.
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-gray-600)", lineHeight: 1.7, marginBottom: "var(--space-base)" }}>
                <strong>Who to mention:</strong> <code style={{ background: "var(--color-gray-200)", padding: "0 4px", borderRadius: "2px" }}>@all_participants</code>. This routes your message to all active personas. Without it, your message would go to Capysan instead.
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-gray-600)", lineHeight: 1.7, marginBottom: "var(--space-base)" }}>
                <strong>What happens:</strong> Each persona receives the question and replies in the chat with their own perspective. You see individual responses with sender labels.
              </p>
              <div
                style={{
                  padding: "var(--space-base)",
                  background: "var(--color-gray-50)",
                  border: "1px solid var(--color-gray-200)",
                  borderRadius: "0.5rem",
                  fontSize: "var(--text-sm)",
                  fontFamily: "monospace",
                }}
              >
                <strong>How to:</strong> Type <code>@all_participants</code> then your question, e.g. “@all_participants what was the last time carpooling didn’t work?”
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-base)",
                  marginBottom: "var(--space-base)",
                }}
              >
                <span
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-teal)",
                    color: "var(--color-white)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  4
                </span>
                <h3
                  style={{
                    fontSize: "var(--text-base)",
                    fontWeight: 600,
                    color: "var(--color-navy)",
                  }}
                >
                  Get synthesis and pain points
                </h3>
              </div>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-gray-600)", lineHeight: 1.7, marginBottom: "var(--space-base)" }}>
                <strong>What you do:</strong> Ask Capysan to summarize the feedback and highlight pain points.
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-gray-600)", lineHeight: 1.7, marginBottom: "var(--space-base)" }}>
                <strong>Who to mention:</strong> No mention, or <code style={{ background: "var(--color-gray-200)", padding: "0 4px", borderRadius: "2px" }}>@capysan</code>. Both route to Capysan, who performs the synthesis.
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-gray-600)", lineHeight: 1.7, marginBottom: "var(--space-base)" }}>
                <strong>What happens:</strong> Capysan reviews the conversation, extracts pain points, and returns a concise summary with actionable items. Shown as a formatted response in the chat.
              </p>
              <div
                style={{
                  padding: "var(--space-base)",
                  background: "var(--color-gray-50)",
                  border: "1px solid var(--color-gray-200)",
                  borderRadius: "0.5rem",
                  fontSize: "var(--text-sm)",
                  fontFamily: "monospace",
                }}
              >
                <strong>How to:</strong> Type <code>@capysan</code> then your request, e.g. “@capysan summarize and highlight painpoints”
              </div>
            </div>

            {/* Step 4 */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-base)",
                  marginBottom: "var(--space-base)",
                }}
              >
                <span
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-teal)",
                    color: "var(--color-white)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  5
                </span>
                <h3
                  style={{
                    fontSize: "var(--text-base)",
                    fontWeight: 600,
                    color: "var(--color-navy)",
                  }}
                >
                  Release personas (optional)
                </h3>
              </div>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-gray-600)", lineHeight: 1.7, marginBottom: "var(--space-base)" }}>
                <strong>What you do:</strong> When you’re done with a group, ask Capysan to release personas. You can release all or specific ones.
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-gray-600)", lineHeight: 1.7, marginBottom: "var(--space-base)" }}>
                <strong>Who to mention:</strong> No mention, or <code style={{ background: "var(--color-gray-200)", padding: "0 4px", borderRadius: "2px" }}>@capysan</code>. Release is an orchestrator action, so the message goes to Capysan.
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-gray-600)", lineHeight: 1.7, marginBottom: "var(--space-base)" }}>
                <strong>What happens:</strong> Capysan removes personas from the studyroom’s session. The Participants sidebar updates. You’re back to talking with Capysan only until you recruit again. You can switch to another studyroom or start a new recruitment in the same room.
              </p>
              <div
                style={{
                  padding: "var(--space-base)",
                  background: "var(--color-gray-50)",
                  border: "1px solid var(--color-gray-200)",
                  borderRadius: "0.5rem",
                  fontSize: "var(--text-sm)",
                  fontFamily: "monospace",
                }}
              >
                <strong>How to:</strong> Type “release all” or “release persona X” in chat. Capysan will confirm who was released.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
