import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

import dotenv from "dotenv"

dotenv.config({ path: "../.env" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE key in .env.local"
  )
  process.exit(1)
}

const SEED_SENTINEL = "00000000-0000-0000-0000-000000000000"

const BASE_CLIENT_OPTIONS = {
  auth: { persistSession: false, autoRefreshToken: false },
}

const base = createClient(supabaseUrl, supabaseKey, BASE_CLIENT_OPTIONS)

const makeClubClient = (clubId) =>
  createClient(supabaseUrl, supabaseKey, {
    ...BASE_CLIENT_OPTIONS,
    global: { headers: { "x-club-id": clubId } },
  })

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min
const pick = (list) => list[randomInt(0, list.length - 1)]

const daysAgo = (days) => new Date(Date.now() - days * 86400000).toISOString()

const CLUB_TEMPLATES = [
  { name: "Lakeside Legends", description: "Balanced two-way group." },
  {
    name: "City Center Cyclones",
    description: "Transition-first scoring pace.",
  },
  {
    name: "Mountain View Mavericks",
    description: "Fundamentals, spacing, and discipline.",
  },
]

const FIRST_NAMES = [
  "Avery",
  "Jordan",
  "Riley",
  "Cameron",
  "Casey",
  "Taylor",
  "Morgan",
  "Parker",
  "Quinn",
  "Hayden",
  "Rowan",
  "Skyler",
  "Reese",
  "Logan",
  "Alex",
]

const LAST_NAMES = [
  "Johnson",
  "Williams",
  "Brown",
  "Davis",
  "Miller",
  "Wilson",
  "Moore",
  "Taylor",
  "Anderson",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Martin",
  "Thompson",
]

const POSITIONS = ["PG", "SG", "SF", "PF", "C"]
const SKILLS = ["Playmaking", "Shooting", "Defense", "Rebounding", "Finishing"]
const HANDS = ["Right", "Left", "Ambidextrous"]

const METRIC_NAMES = [
  "Speed",
  "Agility",
  "Shooting Accuracy",
  "Free Throw %",
  "3PT %",
  "Assists Per Game",
  "Rebounds Per Game",
  "Steals Per Game",
  "Blocks Per Game",
  "Turnovers Per Game",
]

const EVENT_TYPES = [
  "3-Pointer",
  "Free Throw",
  "Layup",
  "Dunk",
  "Assist",
  "Rebound",
  "Steal",
  "Block",
  "Turnover",
  "Foul",
]

const TAGS = [
  { name: "Rim Protector", category: "Defense" },
  { name: "Floor General", category: "Offense" },
  { name: "Sharpshooter", category: "Shooting" },
  { name: "Transition Threat", category: "Athleticism" },
  { name: "Glue Player", category: "Role" },
]

const buildPlayerName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`

async function clearAllExistingData() {
  const { data: clubs, error } = await base.from("clubs").select("id")
  if (error) throw error
  if (!clubs || clubs.length === 0) return

  for (const club of clubs) {
    const supabase = makeClubClient(club.id)
    await supabase.from("training_attendance").delete().neq("id", SEED_SENTINEL)
    await supabase.from("player_metric_logs").delete().neq("id", SEED_SENTINEL)
    await supabase.from("player_tags").delete().neq("id", SEED_SENTINEL)
    await supabase.from("tags").delete().neq("id", SEED_SENTINEL)
    await supabase.from("events").delete().neq("id", SEED_SENTINEL)
    await supabase.from("event_types").delete().neq("id", SEED_SENTINEL)
    await supabase.from("players").delete().neq("id", SEED_SENTINEL)
    await supabase.from("training_sessions").delete().neq("id", SEED_SENTINEL)
    await supabase.from("videos").delete().neq("id", SEED_SENTINEL)

    const clubDelete = await supabase.from("clubs").delete().eq("id", club.id)
    if (clubDelete.error) throw clubDelete.error
  }
}

async function seedClub(club) {
  const supabase = makeClubClient(club.id)

  const { data: eventTypes, error: eventTypesError } = await supabase
    .from("event_types")
    .insert(EVENT_TYPES.map((name) => ({ name, club_id: club.id })))
    .select("id, name")
  if (eventTypesError) throw eventTypesError

  const playerCount = randomInt(14, 22)
  const playersToInsert = Array.from({ length: playerCount }).map(
    (_, index) => ({
      name: `${buildPlayerName()} ${index + 1}`.trim(),
      club_id: club.id,
      position: pick(POSITIONS),
      primary_skill: pick(SKILLS),
      jersey_number: randomInt(0, 99),
      dominant_hand: pick(HANDS),
      is_active: Math.random() > 0.08,
      created_at: daysAgo(randomInt(30, 180)),
    })
  )

  const { data: players, error: playersError } = await supabase
    .from("players")
    .insert(playersToInsert)
    .select("id, name, club_id")
  if (playersError) throw playersError

  const videosToInsert = Array.from({ length: 6 }).map((_, index) => ({
    title: `${club.name} Scrimmage ${index + 1}`,
    file_url: `https://nbnhdyveivqidilkmtle.supabase.co/storage/v1/object/public/videos/3bc4b2c2-94e7-4c8d-99eb-bfbfc41ebaea/1773195561601-856460-hd_1280_720_30fps.mp4`,
    club_id: club.id,
    created_at: daysAgo(randomInt(1, 90)),
  }))

  const { data: videos, error: videosError } = await supabase
    .from("videos")
    .insert(videosToInsert)
    .select("id, club_id")
  if (videosError) throw videosError

  const { data: tags, error: tagsError } = await supabase
    .from("tags")
    .insert(TAGS.map((tag) => ({ ...tag, club_id: club.id })))
    .select("id, club_id")
  if (tagsError) throw tagsError

  const playerTagsToInsert = []
  for (const player of players ?? []) {
    const tagCount = randomInt(1, 3)
    const shuffled = [...(tags ?? [])]
      .sort(() => Math.random() - 0.5)
      .slice(0, tagCount)
    for (const tag of shuffled) {
      playerTagsToInsert.push({
        player_id: player.id,
        tag_id: tag.id,
        club_id: club.id,
      })
    }
  }
  if (playerTagsToInsert.length > 0) {
    const playerTagsInsert = await supabase
      .from("player_tags")
      .insert(playerTagsToInsert)
    if (playerTagsInsert.error) throw playerTagsInsert.error
  }

  const sessionsToInsert = Array.from({ length: 10 }).map((_, index) => ({
    club_id: club.id,
    title: `${club.name} Session ${index + 1}`,
    session_type: index % 3 === 0 ? "match-prep" : "training",
    starts_at: daysAgo(randomInt(1, 90)),
    created_at: daysAgo(randomInt(1, 90)),
  }))
  const { data: sessions, error: sessionsError } = await supabase
    .from("training_sessions")
    .insert(sessionsToInsert)
    .select("id, club_id")
  if (sessionsError) throw sessionsError

  const attendanceToInsert = []
  for (const session of sessions ?? []) {
    for (const player of players ?? []) {
      const roll = Math.random()
      const status = roll < 0.75 ? "present" : roll < 0.9 ? "late" : "absent"
      attendanceToInsert.push({
        session_id: session.id,
        player_id: player.id,
        club_id: club.id,
        status,
        notes: status === "absent" ? "Unavailable" : null,
        created_at: daysAgo(randomInt(1, 90)),
      })
    }
  }
  const attendanceInsert = await supabase
    .from("training_attendance")
    .insert(attendanceToInsert)
  if (attendanceInsert.error) throw attendanceInsert.error

  const eventsToInsert = []
  const eventTypesList = eventTypes ?? []
  for (const video of videos ?? []) {
    const eventCount = 20
    for (let i = 0; i < eventCount; i += 1) {
      const player = pick(players)
      const eventType = pick(eventTypesList)
      eventsToInsert.push({
        video_id: video.id,
        player_id: player.id,
        event_type_id: eventType.id,
        timestamp_seconds: Number((Math.random() * 10).toFixed(2)),
        created_at: daysAgo(randomInt(1, 120)),
      })
    }
  }
  const eventsInsert = await supabase.from("events").insert(eventsToInsert)
  if (eventsInsert.error) throw eventsInsert.error

  const metricLogsToInsert = []
  for (const player of players ?? []) {
    const logCount = randomInt(3, 8)
    for (let i = 0; i < logCount; i += 1) {
      const metricName = pick(METRIC_NAMES)
      const isPercentage = metricName.includes("%") || metricName === "Shooting Accuracy"
      const isRate = metricName.includes("Per Game")
      const metricValue = isPercentage
        ? Number((Math.random() * 100).toFixed(1))
        : isRate
          ? Number((Math.random() * 12).toFixed(1))
          : Number((Math.random() * 100).toFixed(1))
      metricLogsToInsert.push({
        player_id: player.id,
        club_id: club.id,
        metric_name: metricName,
        metric_value: metricValue,
        recorded_at: daysAgo(randomInt(1, 180)),
        created_at: daysAgo(randomInt(1, 180)),
      })
    }
  }
  const metricLogsInsert = await supabase
    .from("player_metric_logs")
    .insert(metricLogsToInsert)
  if (metricLogsInsert.error) throw metricLogsInsert.error

  return {
    clubId: club.id,
    players: players?.length ?? 0,
    videos: videos?.length ?? 0,
    events: eventsToInsert.length,
    eventTypes: eventTypesList.length,
    metricLogs: metricLogsToInsert.length,
  }
}

async function main() {
  const shouldClear = process.env.SEED_CLEAR === "1"
  if (shouldClear) {
    console.log("🧹 Clearing existing data (SEED_CLEAR=1)...")
    await clearAllExistingData()
  }

  console.log("🌱 Seeding synthetic data...")
  const clubsToInsert = CLUB_TEMPLATES.map((template, index) => ({
    ...template,
    contact_email: `club${index + 1}@superstat.local`,
    created_at: daysAgo(randomInt(40, 180)),
  }))

  const { data: clubs, error: clubsError } = await base
    .from("clubs")
    .insert(clubsToInsert)
    .select("id, name")
  if (clubsError) throw clubsError

  const summaries = []
  for (const club of clubs ?? []) {
    const summary = await seedClub(club)
    summaries.push({ name: club.name, ...summary })
  }

  console.log("✅ Done.")
  for (const summary of summaries) {
    console.log(
      `- ${summary.name}: clubId=${summary.clubId} players=${summary.players} videos=${summary.videos} eventTypes=${summary.eventTypes} events=${summary.events} metricLogs=${summary.metricLogs}`
    )
  }
  console.log(
    "Tip: set SEED_CLEAR=1 to wipe existing club-scoped data before inserting."
  )
}

main().catch((error) => {
  console.error("❌ Synthetic seed failed:", error?.message ?? error)
  process.exit(1)
})
