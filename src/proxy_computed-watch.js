let active
// 副作用函数，用以添加依赖
const effect = (fn, options = {}) => {
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
const nextTick = cb => Promise.resolve().then(cb)
const queueJob = job => {
  if (!queue.includes(job)) {
    queue.push(job)
    nextTick(flushJobs)
  }
}
const flushJobs = () => {
  let job
  while ((job = queue.shift()) !== undefined) {
    job()
  }
}

const createReactive = (target, prop, initValue) => {
  const dep = new Dep()
  return new Proxy(target, {
    get(target, prop) {
      dep.depend()
      return Reflect.get(target, prop)
    },
    set(target, prop, value) {
      dep.notify()
      return Reflect.set(target, prop, value)
    }
  })

  // target._dep = new Dep()
  // let value = initValue
  // return Object.defineProperty(target, prop, {
  //   get() {
  //     target._dep.depend()
  //     return value
  //   },
  //   set(newValue) {
  //     value = newValue
  //     target._dep.notify()
  //   }
  // })
}

// const push = Array.prototype.push
// Array.prototype.push = function (...args) {
//   push.apply(this, [...args])
//   this._dep && this._dep.notify()
// }

const ref = initValue => createReactive({}, 'value', initValue)

const set = (target, prop, initValue) => createReactive(target, prop, initValue)

const computed = fn => {
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

const watch = (source, cb, options = {}) => {
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

// let count = ref(0)
let count = set([], 1, 0)
let value = 0

// let computedValue = computed(() => count.value + 3)
document.getElementById('add').addEventListener('click', function () {
  // count.value++
  // if (!count.v) {
  //   // count.v = 0
  //   set(count, 'v', 0)
  // }
  // count.v++
  // count[0]++
  value++
  count.push(value)
  console.log(count)
})

const stop = watchEffect(() => {
  let str = `hello ${count.join(',')} `
  document.getElementById('app').innerText = str
})

// const stop = watchEffect(() => {
//   let str = `hello ${count.v} `
//   document.getElementById('app').innerText = str
// })

// setTimeout(() => {
//   stop()
// }, 2000)

watch(
  () => count.value,
  (newValue, oldValue) => {
    console.log(newValue, oldValue)
  },
  { immediate: true }
)
