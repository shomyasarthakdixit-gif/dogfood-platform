/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const { Pool } = require('pg');

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('Starting seed...');

    // Organizer
    const resOrg = await pool.query(`
      INSERT INTO users (email, name, role) 
      VALUES ('organizer@dogfood.local', 'Demo Organizer', 'USER')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id;
    `);
    const orgId = resOrg.rows[0].id;

    // Judges
    const judges = [];
    for (let i = 1; i <= 3; i++) {
      const res = await pool.query(`
        INSERT INTO users (email, name, role) 
        VALUES ($1, $2, 'USER')
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id;
      `, [`judge${i}@dogfood.local`, `Demo Judge ${i}`]);
      judges.push(res.rows[0].id);
    }

    // Participants
    const participants = [];
    for (let i = 1; i <= 6; i++) {
      const res = await pool.query(`
        INSERT INTO users (email, name, role) 
        VALUES ($1, $2, 'USER')
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id;
      `, [`participant${i}@dogfood.local`, `Participant ${i}`]);
      participants.push(res.rows[0].id);
    }

    // Event
    const resEvent = await pool.query(`
      INSERT INTO events (slug, name, description, start_date, end_date, status, voting_start, voting_end)
      VALUES ('dogfood-2026', 'Dogfood 2026', 'The ultimate hackathon challenge.', NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days', 'VOTING', NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status, voting_start = EXCLUDED.voting_start, voting_end = EXCLUDED.voting_end RETURNING id;
    `);
    const eventId = resEvent.rows[0].id;

    // Event Members
    await pool.query(`INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'ORGANIZER') ON CONFLICT DO NOTHING`, [eventId, orgId]);
    for (const judgeId of judges) {
      await pool.query(`INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'JUDGE') ON CONFLICT DO NOTHING`, [eventId, judgeId]);
    }
    for (const partId of participants) {
      await pool.query(`INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'PARTICIPANT') ON CONFLICT DO NOTHING`, [eventId, partId]);
    }

    // Track & Prize
    const resTrack = await pool.query(`
      INSERT INTO tracks (event_id, name, description)
      SELECT $1, 'Core Platform', 'Build tools for developers'
      WHERE NOT EXISTS (SELECT 1 FROM tracks WHERE event_id = $1 AND name = 'Core Platform')
      RETURNING id;
    `, [eventId]);
    const trackId = resTrack.rows[0]?.id || (await pool.query(`SELECT id FROM tracks WHERE event_id = $1 AND name = 'Core Platform'`, [eventId])).rows[0].id;

    await pool.query(`
      INSERT INTO prizes (event_id, track_id, name, amount)
      SELECT $1, $2, 'Grand Prize', '$10,000'
      WHERE NOT EXISTS (SELECT 1 FROM prizes WHERE event_id = $1 AND name = 'Grand Prize');
    `, [eventId, trackId]);

    // Teams
    const teamNames = ['Team Alpha', 'Team Beta', 'Team Gamma'];
    const teams = [];
    for (const name of teamNames) {
      const resTeam = await pool.query(`
        INSERT INTO teams (event_id, name, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (event_id, name) DO UPDATE SET description = EXCLUDED.description RETURNING id;
      `, [eventId, name, `Description for ${name}`]);
      teams.push(resTeam.rows[0].id);
    }

    // Team Members
    await pool.query(`INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'LEADER') ON CONFLICT DO NOTHING`, [teams[0], participants[0]]);
    await pool.query(`INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'MEMBER') ON CONFLICT DO NOTHING`, [teams[0], participants[1]]);
    
    await pool.query(`INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'LEADER') ON CONFLICT DO NOTHING`, [teams[1], participants[2]]);
    await pool.query(`INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'MEMBER') ON CONFLICT DO NOTHING`, [teams[1], participants[3]]);

    await pool.query(`INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'LEADER') ON CONFLICT DO NOTHING`, [teams[2], participants[4]]);
    await pool.query(`INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'MEMBER') ON CONFLICT DO NOTHING`, [teams[2], participants[5]]);

    // Submissions
    const subNames = ['Alpha Project', 'Beta Project', 'Gamma Project'];
    const submissions = [];
    for (let i = 0; i < teams.length; i++) {
      const resSub = await pool.query(`
        INSERT INTO submissions (team_id, event_id, title, url, status)
        VALUES ($1, $2, $3, $4, 'SUBMITTED')
        ON CONFLICT (team_id, event_id) DO UPDATE SET title = EXCLUDED.title RETURNING id;
      `, [teams[i], eventId, subNames[i], `https://github.com/dogfood/${subNames[i].toLowerCase().replace(' ', '-')}`]);
      submissions.push(resSub.rows[0].id);
    }

    // Rubric & Criteria
    const resRubric = await pool.query(`
      INSERT INTO rubrics (event_id, name)
      SELECT $1, 'Standard Judging Rubric'
      WHERE NOT EXISTS (SELECT 1 FROM rubrics WHERE event_id = $1 AND name = 'Standard Judging Rubric')
      RETURNING id;
    `, [eventId]);
    const rubricId = resRubric.rows[0]?.id || (await pool.query(`SELECT id FROM rubrics WHERE event_id = $1 AND name = 'Standard Judging Rubric'`, [eventId])).rows[0].id;

    const resCrit1 = await pool.query(`
      INSERT INTO rubric_criteria (rubric_id, name, max_score, weight)
      SELECT $1, 'Innovation', 10, 1.0
      WHERE NOT EXISTS (SELECT 1 FROM rubric_criteria WHERE rubric_id = $1 AND name = 'Innovation')
      RETURNING id;
    `, [rubricId]);
    const crit1Id = resCrit1.rows[0]?.id || (await pool.query(`SELECT id FROM rubric_criteria WHERE rubric_id = $1 AND name = 'Innovation'`, [rubricId])).rows[0].id;

    const resCrit2 = await pool.query(`
      INSERT INTO rubric_criteria (rubric_id, name, max_score, weight)
      SELECT $1, 'Technical Complexity', 10, 2.0
      WHERE NOT EXISTS (SELECT 1 FROM rubric_criteria WHERE rubric_id = $1 AND name = 'Technical Complexity')
      RETURNING id;
    `, [rubricId]);
    const crit2Id = resCrit2.rows[0]?.id || (await pool.query(`SELECT id FROM rubric_criteria WHERE rubric_id = $1 AND name = 'Technical Complexity'`, [rubricId])).rows[0].id;

    // Judge Profiles
    const judgeProfiles = [];
    for (const judgeId of judges) {
      const resJudgeProf = await pool.query(`
        INSERT INTO judge_profiles (user_id, event_id, background)
        VALUES ($1, $2, 'Senior Engineer')
        ON CONFLICT (user_id, event_id) DO UPDATE SET background = EXCLUDED.background RETURNING id;
      `, [judgeId, eventId]);
      judgeProfiles.push(resJudgeProf.rows[0].id);
    }

    // Judge Assignments (Cross-matrix)
    // Judge 1 reviews Sub 1 and Sub 2
    // Judge 2 reviews Sub 2 and Sub 3
    // Judge 3 reviews Sub 3 and Sub 1
    const assignments = [
      [judgeProfiles[0], submissions[0]],
      [judgeProfiles[0], submissions[1]],
      [judgeProfiles[1], submissions[1]],
      [judgeProfiles[1], submissions[2]],
      [judgeProfiles[2], submissions[2]],
      [judgeProfiles[2], submissions[0]],
    ];

    // We will create different scoring patterns to demonstrate normalization
    const scorePatterns = [
      { j: 0, scores: [ [8, 9], [7, 8] ] }, // Judge 1 scores high
      { j: 1, scores: [ [4, 5], [5, 6] ] }, // Judge 2 scores low
      { j: 2, scores: [ [6, 7], [9, 9] ] }, // Judge 3 scores mid-high
    ];

    let assignIdx = 0;
    for (const [jId, sId] of assignments) {
      const jaRes = await pool.query(`
        INSERT INTO judge_assignments (judge_id, submission_id, status)
        VALUES ($1, $2, 'COMPLETED')
        ON CONFLICT (judge_id, submission_id) DO UPDATE SET status = 'COMPLETED' RETURNING id;
      `, [jId, sId]);
      
      const jaId = jaRes.rows[0].id;
      
      const pattern = scorePatterns.find(p => p.j === judgeProfiles.indexOf(jId));
      const s = pattern.scores.shift();
      const score1 = s[0];
      const score2 = s[1];
      const total = (score1 / 10 * 1.0 + score2 / 10 * 2.0) / 3.0 * 100;

      const evRes = await pool.query(`
        INSERT INTO evaluations (assignment_id, status, total_score)
        VALUES ($1, 'SUBMITTED', $2)
        ON CONFLICT (assignment_id) DO UPDATE SET total_score = $2 RETURNING id;
      `, [jaId, total]);

      const evId = evRes.rows[0].id;

      await pool.query(`
        INSERT INTO evaluation_scores (evaluation_id, criterion_id, score) VALUES ($1, $2, $3)
        ON CONFLICT (evaluation_id, criterion_id) DO NOTHING;
      `, [evId, crit1Id, score1]);
      
      await pool.query(`
        INSERT INTO evaluation_scores (evaluation_id, criterion_id, score) VALUES ($1, $2, $3)
        ON CONFLICT (evaluation_id, criterion_id) DO NOTHING;
      `, [evId, crit2Id, score2]);
    }

    console.log('Seed completed successfully.');
  } catch (err) {
    console.error('Seed failed:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seed().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seed };
