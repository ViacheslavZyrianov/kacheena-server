const dayjs = require('dayjs')

module.exports = (startFromDate, daysOfWeek, numMonths) => {
  const result = []
  let currentDate = dayjs(startFromDate)

  for (let i = 0; i < numMonths; i++) {
    for (let day in daysOfWeek) {
      const dayOfWeek = parseInt(day) + 1
      const { time, exercises } = daysOfWeek[day]
      let nextDate = currentDate.day(dayOfWeek).hour(time.slice(0, 2)).minute(time.slice(3))
      if (nextDate.isBefore(currentDate)) {
        nextDate = nextDate.add(1, 'week')
      }
      while (nextDate.isSame(currentDate) || nextDate.isBefore(currentDate.add(numMonths, 'month'))) {
        const training = {
          date: nextDate.format('YYYY-MM-DD'),
          time: nextDate.format('HH:mm'),
          exercises
        }
        if (!result.some(item => item.date === training.date && item.time === training.time)) {
          result.push(training)
        }
        nextDate = nextDate.add(1, 'week')
      }
    }
    currentDate = currentDate.add(1, 'month').startOf('month')
  }

  return result
}