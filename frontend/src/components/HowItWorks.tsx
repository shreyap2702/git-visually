import './HowItWorks.css'

function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Paste Repository',
      description: 'Share a GitHub repository URL. No authentication needed for public repos.',
    },
    {
      number: '2',
      title: 'Describe Your Question',
      description: 'Tell us what you want to understand - architecture, data flows, or get a general overview.',
    },
    {
      number: '3',
      title: 'Explore Visuals',
      description: 'Get instant diagrams and insights about your codebase structure and relationships.',
    },
  ]

  return (
    <section className="how-it-works">
      <div className="how-it-works-container">
        <h2 className="how-it-works-title">How it works</h2>
        <div className="how-it-works-grid">
          {steps.map((step) => (
            <div key={step.number} className="how-it-works-step">
              <div className="step-number">{step.number}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
