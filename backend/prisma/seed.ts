import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.userSettings.upsert({
    where: { id: 1 },
    create: {
      email: "student@example.com",
      displayName: "Student",
      trialEnd: new Date("2026-04-04T23:59:59.000Z"),
      academicLevel: "university",
      timerVolume: 0.45,
    },
    update: {
      timerVolume: 0.45,
    },
  });

  await prisma.term.deleteMany({});
  const start = new Date("2026-03-28T00:00:00.000Z");
  const end = new Date("2026-05-16T23:59:59.000Z");

  const term = await prisma.term.create({
    data: {
      name: "MASTER DSA & DEVELOPMENT",
      startDate: start,
      endDate: end,
      studyGoalHours: 600,
      dailyGoalMinutes: 720,
      examCount: 0,
      goldMedals: 4,
      silverMedals: 0,
      bronzeMedals: 1,
      isActive: true,
    },
  });

  const dsa = await prisma.course.create({
    data: { termId: term.id, name: "DSA", color: "blue" },
  });
  const college = await prisma.course.create({
    data: { termId: term.id, name: "College Work", color: "yellow" },
  });
  const dev = await prisma.course.create({
    data: { termId: term.id, name: "Development", color: "orange" },
  });

  const day = (d: string) => new Date(`${d}T12:00:00.000Z`);

  await prisma.session.createMany({
    data: [
      {
        termId: term.id,
        courseId: dsa.id,
        date: day("2026-03-28"),
        startTime: "09:00",
        endTime: "11:00",
        breakMinutes: 10,
        activity: "Problems",
        note: "Trees",
        label: "Lecture",
      },
      {
        termId: term.id,
        courseId: dev.id,
        date: day("2026-03-29"),
        startTime: "14:00",
        endTime: "17:30",
        breakMinutes: 15,
        activity: "Build",
        note: "React dashboard",
        label: "",
      },
      {
        termId: term.id,
        courseId: college.id,
        date: day("2026-03-30"),
        startTime: "10:00",
        endTime: "13:00",
        breakMinutes: 0,
        activity: "Assignment",
        note: "MAT 401",
        label: "",
      },
      {
        termId: term.id,
        courseId: dsa.id,
        date: day("2026-03-31"),
        startTime: "08:00",
        endTime: "12:00",
        breakMinutes: 20,
        activity: "Graphs",
        note: "",
        label: "",
      },
      {
        termId: term.id,
        courseId: dev.id,
        date: day("2026-04-01"),
        startTime: "09:00",
        endTime: "11:00",
        breakMinutes: 10,
        activity: "API",
        note: "Sessions CRUD",
        label: "Lecture",
      },
    ],
  });

  await prisma.activityTemplate.deleteMany({});
  await prisma.activityTemplate.createMany({
    data: [{ name: "Memorize" }, { name: "Problems" }, { name: "Review" }],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
