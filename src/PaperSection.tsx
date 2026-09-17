import katex from 'katex';
import { useMemo } from 'react';

function Tex({ children, display = false }: { children: string; display?: boolean }) {
  const html = useMemo(() => katex.renderToString(children, { throwOnError: false, displayMode: display }), [children, display]);
  if (display) return <div className="tex-block" dangerouslySetInnerHTML={{ __html: html }} />;
  return <span className="tex-inline" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function PaperSection() {
  return (
    <section id="paper" className="paper">
      <div className="paper-card">
        <header className="paper-header">
          <h2>Job Assignment Using Network Flow</h2>
          <p className="paper-byline">Joshua Straus</p>
          <p className="paper-dates">November 2025<br />Revised September 2026</p>
        </header>

        <h3>1 Problem Description</h3>
        <p>
          In order to make roads safe next winter, the city of Madison is planning work shifts for snow plough drivers.
          There are 6 shifts, numbered 1 through 6, of 4 hours each in a day, and a total of <Tex>n</Tex> jobs over all 6
          shifts combined. The <Tex>i</Tex>-th job belongs to shift <Tex>{'s_i \\in [6]'}</Tex> and needs to be assigned
          exactly <Tex>d_i</Tex> drivers. There are <Tex>m</Tex> drivers in total. Due to the characteristics of their
          snow ploughs and other constraints, the <Tex>j</Tex>-th driver can only help with jobs in{' '}
          <Tex>{'R_j \\subseteq [n]'}</Tex>. Moreover, each driver can work at most 2 shifts per day, and during a given
          work shift can help with only a single job.
        </p>
        <p className="paper-item">
          <span>
            Design an algorithm that takes as input <Tex>n</Tex>, <Tex>m</Tex>, <Tex>{'(s_i, d_i)'}</Tex> for{' '}
            <Tex>{'i \\in [n]'}</Tex> and <Tex>R_j</Tex> for <Tex>{'j \\in [m]'}</Tex>, and outputs a daily assignment of
            jobs for each driver such that all requirements are met, or reports that no such assignment exists. Your
            algorithm should run in time <Tex>{'O(N^3)'}</Tex>, where <Tex>{'N := n + m'}</Tex>.
          </span>
        </p>

        <h3>Solution</h3>
        <p>To solve this problem, we will create an algorithm that:</p>
        <ol className="paper-list">
          <li>Creates a flow network representing the problem.</li>
          <li>Runs a maximum-flow algorithm on the network.</li>
          <li>Uses the resulting flow to produce a valid assignment, if one exists.</li>
        </ol>

        <p>
          First, we construct the flow network. In this network, each unit of flow along an <Tex>s</Tex>–<Tex>t</Tex>{' '}
          path will represent the assignment of one driver to one job.
        </p>

        <p>
          Create a set <Tex>D</Tex> of <Tex>m</Tex> vertices, with one vertex <Tex>D_j</Tex> for each driver <Tex>j</Tex>.
          Create a set <Tex>J</Tex> of <Tex>n</Tex> vertices, with one vertex <Tex>J_i</Tex> for each job <Tex>i</Tex>.
          Let <Tex>K</Tex> be a set of <Tex>6m</Tex> vertices, where <Tex>{'K_{j,\\ell}'}</Tex> represents driver{' '}
          <Tex>j</Tex> working during shift <Tex>{'\\ell'}</Tex>, for <Tex>{'\\ell \\in \\{1, \\dots, 6\\}'}</Tex>.
          Finally, let <Tex>s</Tex> be the source vertex and <Tex>t</Tex> be the sink vertex.
        </p>

        <p>
          Connect <Tex>s</Tex> to each driver vertex <Tex>D_j</Tex> with an edge of capacity 2. This represents the fact
          that each driver may be assigned to at most two jobs.
        </p>

        <p>
          For each driver <Tex>j</Tex> and shift <Tex>{'\\ell'}</Tex>, connect <Tex>D_j</Tex> to{' '}
          <Tex>{'K_{j,\\ell}'}</Tex> with an edge of capacity 1 if <Tex>R_j</Tex> contains at least one job occurring
          during shift <Tex>{'\\ell'}</Tex>. This capacity ensures that driver <Tex>j</Tex> can perform at most one job
          during shift <Tex>{'\\ell'}</Tex>.
        </p>

        <p>
          Next, connect <Tex>{'K_{j,\\ell}'}</Tex> to job vertex <Tex>J_i</Tex> with an edge of capacity 1 if job{' '}
          <Tex>i</Tex> occurs during shift <Tex>{'\\ell'}</Tex> and <Tex>{'i \\in R_j'}</Tex>. Thus, such an edge exists
          exactly when driver <Tex>j</Tex> is eligible to perform job <Tex>i</Tex> during its assigned shift.
        </p>

        <p>
          Finally, connect each job vertex <Tex>J_i</Tex> to <Tex>t</Tex> with an edge of capacity <Tex>d_i</Tex>, where{' '}
          <Tex>d_i</Tex> is the number of drivers required for job <Tex>i</Tex>.
        </p>

        <p>Run a maximum-flow algorithm on this network. Let</p>
        <Tex display>{'D_{\\text{required}} = \\sum_{i=1}^{n} d_i.'}</Tex>

        <p>
          If the maximum-flow value is <Tex>{'D_{\\text{required}}'}</Tex>, output the assignments represented by the
          flow: for every edge <Tex>{'K_{j,\\ell} \\to J_i'}</Tex> carrying one unit of flow, assign driver <Tex>j</Tex>{' '}
          to job <Tex>i</Tex>. If the maximum-flow value is less than <Tex>{'D_{\\text{required}}'}</Tex>, output that no
          valid assignment exists.
        </p>

        <h3>Time Complexity</h3>
        <p>The graph contains</p>
        <Tex display>{'1 + m + 6m + n + 1 = O(m + n)'}</Tex>
        <p>vertices.</p>

        <p>
          There are <Tex>m</Tex> edges from <Tex>s</Tex> to the driver vertices, at most <Tex>6m</Tex> edges from driver
          vertices to driver-shift vertices, at most <Tex>mn</Tex> edges from driver-shift vertices to job vertices, and{' '}
          <Tex>n</Tex> edges from job vertices to <Tex>t</Tex>. Therefore,
        </p>
        <Tex display>{'E = O(m + 6m + mn + n) = O(mn)'}</Tex>
        <p>in the worst case.</p>

        <p>
          Using Ford–Fulkerson, the running time is <Tex>{'O(E|f^*|)'}</Tex>, where <Tex>{'|f^*|'}</Tex> is the value of
          the maximum flow. Because each of the <Tex>m</Tex> drivers can be assigned to at most two jobs,
        </p>
        <Tex display>{'|f^*| \\le 2m.'}</Tex>
        <p>Therefore, the maximum-flow computation takes</p>
        <Tex display>{'O(E|f^*|) = O(mn \\cdot m) = O(m^2 n).'}</Tex>
        <p>
          The construction of the graph and extraction of the assignment take <Tex>{'O(mn)'}</Tex> time, so the total
          running time is <Tex>{'O(m^2n)'}</Tex>. If <Tex>{'N = m + n'}</Tex>, then <Tex>{'m^2n \\le N^3'}</Tex>, so the
          running time is also <Tex>{'O(N^3)'}</Tex>.
        </p>

        <h3>Proof of Correctness</h3>
        <p>We prove that the algorithm outputs a valid assignment if and only if a valid assignment exists.</p>

        <p>
          <b>Forward direction.</b> Suppose the algorithm outputs an assignment. It does so only when the maximum flow
          has value
        </p>
        <Tex display>{'\\sum_{i=1}^{n} d_i.'}</Tex>

        <p>
          Because every capacity in the network is an integer, the integrality theorem for maximum flow guarantees that
          an integral maximum flow exists. We can therefore interpret each unit of flow as a single driver-job
          assignment.
        </p>

        <p>Every unit of flow follows a path of the form</p>
        <Tex display>{'s \\to D_j \\to K_{j,\\ell} \\to J_i \\to t.'}</Tex>

        <p>
          Such a path represents assigning driver <Tex>j</Tex> to job <Tex>i</Tex>. This assignment satisfies every
          constraint:
        </p>
        <ol className="paper-list">
          <li>
            The edge <Tex>{'s \\to D_j'}</Tex> has capacity 2, so driver <Tex>j</Tex> is assigned to at most two jobs.
          </li>
          <li>
            The edge <Tex>{'D_j \\to K_{j,\\ell}'}</Tex> has capacity 1, so driver <Tex>j</Tex> is assigned to at most
            one job during shift <Tex>{'\\ell'}</Tex>.
          </li>
          <li>
            An edge <Tex>{'K_{j,\\ell} \\to J_i'}</Tex> exists only if job <Tex>i</Tex> occurs during shift{' '}
            <Tex>{'\\ell'}</Tex> and <Tex>{'i \\in R_j'}</Tex>, so every driver is assigned only to a job they are
            eligible to perform.
          </li>
          <li>
            The edge <Tex>{'J_i \\to t'}</Tex> has capacity <Tex>d_i</Tex>, so no more than <Tex>d_i</Tex> drivers are
            assigned to job <Tex>i</Tex>.
          </li>
          <li>
            The total flow value is <Tex>{'\\sum_i d_i'}</Tex>. Since the total capacity of all edges entering{' '}
            <Tex>t</Tex> is also <Tex>{'\\sum_i d_i'}</Tex>, every edge <Tex>{'J_i \\to t'}</Tex> must be saturated.
            Therefore, exactly <Tex>d_i</Tex> drivers are assigned to every job <Tex>i</Tex>.
          </li>
        </ol>
        <p>Thus, the algorithm's output is a valid assignment.</p>

        <p>
          <b>Reverse direction.</b> Conversely, suppose a valid assignment exists. For every assignment of driver{' '}
          <Tex>j</Tex> to job <Tex>i</Tex>, let <Tex>{'\\ell'}</Tex> be the shift containing job <Tex>i</Tex>, and send
          one unit of flow along
        </p>
        <Tex display>{'s \\to D_j \\to K_{j,\\ell} \\to J_i \\to t.'}</Tex>

        <p>
          Because the assignment is valid, no driver is assigned to more than two jobs, so the capacity of{' '}
          <Tex>{'s \\to D_j'}</Tex> is respected. No driver performs more than one job during the same shift, so the
          capacity of <Tex>{'D_j \\to K_{j,\\ell}'}</Tex> is respected. Each assigned job belongs to <Tex>R_j</Tex> and
          occurs during shift <Tex>{'\\ell'}</Tex>, so the required edge <Tex>{'K_{j,\\ell} \\to J_i'}</Tex> exists.
          Finally, exactly <Tex>d_i</Tex> drivers are assigned to job <Tex>i</Tex>, so the capacity of{' '}
          <Tex>{'J_i \\to t'}</Tex> is respected.
        </p>

        <p>Therefore, the valid assignment produces a feasible flow of value</p>
        <Tex display>{'\\sum_{i=1}^{n} d_i.'}</Tex>

        <p>
          No flow can have a greater value because the total capacity of the edges entering <Tex>t</Tex> is exactly{' '}
          <Tex>{'\\sum_i d_i'}</Tex>. Consequently, the maximum-flow value is <Tex>{'\\sum_i d_i'}</Tex>, and the
          algorithm outputs a valid assignment.
        </p>

        <p>Hence, the algorithm outputs a valid assignment if and only if a valid assignment exists.</p>
      </div>
    </section>
  );
}
