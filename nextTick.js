let active
let watch = cb => {
  active = cb
  active()
  active = null
}

// 核心：利用宏任务、微任务队列；
// 宏任务执行时添加微任务队列，后依次执行promise微任务
let queue = []
let nextTick = cb => Promise.resolve().then(cb)
let queueJob = job => {
  if (!queue.includes(job)) {
    queue.push(job)
    nextTick(flushJobs)
  }
}
let flushJobs = () => {
  let job
  while ((job = queue.shift()) !== undefined) {
    job()
  }
}

class Dep {
  constructor() {
    this.deps = new Set()
  }
  depend() {
    if (active) {
      this.deps.add(active)
    }
  }
  notify() {
    this.deps.forEach(dep => queueJob(dep))
  }
}

let ref = initValue => {
  let value = initValue
  let dep = new Dep()

  return Object.defineProperty({}, 'value', {
    get() {
      dep.depend()
      return value
    },
    set(newValue) {
      value = newValue
      dep.notify()
    }
  })
}

let x = ref(1)
let y = ref(2)
let z = ref(2)

watch(() => {
  console.log(`hello ${x.value} ${y.value} ${z.value} `)
})

x.value = 2
y.value = 3
z.value = 3
