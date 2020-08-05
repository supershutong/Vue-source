let active
let effect = (fn, options = {}) => {
  let effectFn = (...args) => {
    try {
      active = effectFn
      return fn(...args)
    } finally {
      active = null
    }
  }
  effectFn.options = options
  return effectFn
}

let watchEffect = cb => {
  let runner = effect(cb)
  runner()
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
    this.deps.forEach(dep => {
      queueJob(dep)
      dep.options?.schedular && dep.options.schedular()
    })
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

let computed = fn => {
  let value
  let dirty = true

  let runner = effect(fn, {
    schedular: () => {
      dirty = true
    }
  })

  return {
    get value() {
      if (dirty) {
        value = runner()
        dirty = false
      }
      return value
    }
  }
}

let watch = (source, cb, options = {}) => {
  const { immediate } = options
  const getter = () => source()
  let oldValue

  const runner = effect(getter, {
    schedular: () => {
      applyCb()
    }
  })

  const applyCb = () => {
    let newValue = runner()
    if (oldValue !== newValue) {
      cb(newValue, oldValue)
      oldValue = newValue
    }
  }

  if (immediate) {
    applyCb()
  } else {
    oldValue = runner()
  }
}

let count = ref(0)
let computedValue = computed(() => count.value + 3)
document.getElementById('add').addEventListener('click', function () {
  count.value++
})

watchEffect(() => {
  let str = `hello ${count.value} ${computedValue.value}`
  // console.log(str);
  document.getElementById('app').innerText = str
})

watch(
  () => count.value,
  (newValue, oldValue) => {
    console.log(newValue, oldValue)
  },
  { immediate: true }
)
