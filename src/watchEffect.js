let active
// 副作用函数，用以添加依赖
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
  effectFn.deps = []
  return effectFn
}

const cleanUpEffect = effect => {
  const { deps } = effect
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect)
  }
}

const watchEffect = cb => {
  const runner = effect(cb)
  runner()

  return () => {
    cleanUpEffect(runner)
  }
}

class Dep {
  constructor() {
    this.deps = new Set()
  }
  depend() {
    if (active) {
      this.deps.add(active)
      // 形成this.deps与active的双向索引
      active.deps.push(this.deps)
    }
  }
  notify() {
    this.deps.forEach(dep => {
      queueJob(dep)
      dep.options?.schedular && dep.options.schedular()
    })
  }
}

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

let stop = watchEffect(() => {
  let str = `hello ${count.value} ${computedValue.value}`
  // console.log(str);
  document.getElementById('app').innerText = str
})

setTimeout(() => {
  stop()
}, 2000)

watch(
  () => count.value,
  (newValue, oldValue) => {
    console.log(newValue, oldValue)
  },
  { immediate: true }
)
