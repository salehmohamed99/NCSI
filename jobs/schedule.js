const agenda = require('./agendaJobs');

require('./test')(agenda);

agenda.on('ready', async () => {
  // Schedule the job to run every minute
  await agenda.every('1 minute', 'update recent messages');

  // Start processing jobs
  await agenda.start();
});

agenda.on('error', (err) => {
  console.error('Agenda connection error:', err);
});