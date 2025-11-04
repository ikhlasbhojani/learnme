<!--
Sync Impact Report:
Version change: N/A → 1.0.0 (initial constitution)
Modified principles: N/A (new constitution)
Added sections: 
  - Core Principles (5 principles)
  - Development Workflow
  - Governance
Templates requiring updates:
  ✅ .specify/templates/plan-template.md (Constitution Check section exists, compatible)
  ✅ .specify/templates/spec-template.md (compatible with TDD-first approach)
  ✅ .specify/templates/tasks-template.md (compatible with TDD-first approach)
  ✅ .specify/templates/checklist-template.md (no constitution references)
Follow-up TODOs: None
-->

# LearnMe Constitution

## Core Principles

### I. Test-Driven Development (TDD) First (NON-NEGOTIABLE)
All new features MUST start with writing test cases before coding. Code must be written strictly according to the defined tests. Maintain high test coverage for all modules. Testing strategy: unit tests for individual components and functions, integration tests for module interactions, end-to-end tests for critical user flows. Implementation follows Red-Green-Refactor cycle: write failing tests that define desired behavior, write minimum code to pass tests, refactor while keeping tests green, ensure all tests pass before marking work complete.

### II. Code Quality & Readability
Code MUST remain clean, readable, and maintainable. A fully modular architecture must be followed for both frontend and backend. Code reviews are mandatory before merging any changes. Enforce code linting and formatting using tools like ESLint and Prettier. Code must be well-documented with clear comments and documentation. Use clear, descriptive names for variables, functions, and components. Follow established coding standards and style guides. Keep functions small and focused on a single responsibility. Avoid code duplication through proper abstraction.

### III. User Experience Consistency
UI/UX MUST follow a standardized design system. Ensure accessibility standards are met (WCAG guidelines). All interfaces must be responsive and work across devices. Maintain visual and interactive consistency across the application. Focus on usability and continuous performance improvements in the user experience. Use shared component libraries and design tokens. Optimize for loading times and interaction responsiveness. Ensure keyboard navigation and screen reader compatibility.

### IV. Performance Requirements
Code MUST be optimized with no unnecessary complexity. APIs must be efficient and deliver fast response times. Utilize performance best practices like caching, lazy loading, and optimization techniques. Eliminate unnecessary complexity and optimize algorithms. Manage resources efficiently (memory, network, CPU). Profile and measure performance before and after optimizations. Implement caching strategies where appropriate. Minimize bundle sizes and leverage code splitting. Monitor and track performance metrics continuously.

### V. Library & Dependency Standards
Only actively maintained, secure, and reliable libraries MUST be used. Before installing any library, a web search must be performed to verify the latest stable version. Only use libraries that are actively maintained. Ensure libraries are secure and have no known vulnerabilities. Choose libraries with proven track records and community support. Perform regular dependency updates and security audits. Evaluation criteria: active maintenance (recent commits, releases), community size and engagement, license compatibility, bundle size impact, security track record. Regularly update dependencies to latest stable versions and run security audits.

## Development Workflow

All code must pass automated checks (linting, tests, security scans) before merging. Peer review is mandatory before merging any changes. Constitution violations must be addressed before approval. Complexity must be justified with clear rationale. All PRs/reviews must verify compliance with constitution principles.

## Governance

This constitution supersedes all other practices. Amendments require documentation, approval, and migration plan. All team members are responsible for upholding these principles. The constitution is a living document and should evolve with the project. Regularly review and update this constitution based on project evolution and team feedback.

**Version**: 1.0.0 | **Ratified**: 2024-12-19 | **Last Amended**: 2024-12-19
