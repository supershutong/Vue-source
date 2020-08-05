/* eslint-disable no-unused-vars */
// let x;
// let y;
// let f = n => n * 100 + 100;

let active

let effect = (fn, options = {}) => {
  let effect = (...args) => {
    try {
      active = effect
      return fn(...args)
    } finally {
      active = null
    }
  }

  effect.options = options
  effect.deps = []

  return effect
}

let cleanUpEffect = effect => {
  const { deps } = effect

  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect)
    }
  }
}

let watchEffect = function (cb) {
  let runner = effect(cb)
  runner()

  return () => {
    cleanUpEffect(runner)
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

class Dep {
  constructor() {
    this.deps = new Set()
  }
  depend() {
    if (active) {
      this.deps.add(active)
      active.deps.push(this.deps)
    }
  }
  notify() {
    this.deps.forEach(dep => {
      if (dep.options && dep.options.schedular) {
        dep.options.schedular()
      } else {
        queueJob(dep)
      }
    })
  }
}

let push = Array.prototype.push
let arrayMethods = Object.create(Array.prototype)

arrayMethods.push = function (...args) {
  push.apply(this, [...args])
  this._dep.notify()
}

let createReactive = (target, prop, value) => {
  target._dep = new Dep()
  // return new Proxy(target, {
  //   get(target, prop) {
  //     dep.depend();
  //     return Reflect.get(target, prop);
  //   },
  //   set(target, prop, value) {
  //     dep.notify();
  //     return Reflect.set(target, prop, value);
  //   },
  // });

  if (Array.isArray(target)) {
    target.__proto__ = arrayMethods
  }

  return Object.defineProperty(target, prop, {
    get() {
      target._dep.depend()
      return value
    },
    set(newValue) {
      value = newValue
      target._dep.notify()
    }
  })
}

let ref = initValue => createReactive({}, 'value', initValue)

const set = (target, prop, initValue) => createReactive(target, prop, initValue)

let computed = fn => {
  let value
  let dirty = true

  let runner = effect(fn, {
    schedular: () => {
      if (!dirty) {
        dirty = true
      }
    },
    computed: true
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
    if (newValue !== oldValue) {
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
// let count = set([], 1, 0);
let computedValue = computed(() => {
  return count.value + 3
})

// Vue.set(obj, prop, key);
/**
 * push
 * pop
 * shift
 * unshift
 * splice
 * sort
 * reverse
 */
let value = 0

document.getElementById('add').addEventListener('click', function () {
  count.value++
  // if (!count.v) {
  //   set(count, "v", 0);
  // }
  // count.v++;
  // count[0]++;
  // console.log(count);
  // value++;
  // count.push(value);
})
let str
let stop = watchEffect(() => {
  str = `hello ${count.value}  ${computedValue.value}`
  document.getElementById('app').innerText = str
})

// setTimeout(() => {
//   stop();
// }, 3000);
watch(
  () => count.value,
  (newValue, oldValue) => {
    console.log(newValue, oldValue)
  },
  { immediate: true }
)

// 1. let x = computed(() => count.value + 3);
// 2. watch(() => count.value, (currentValue, preValue) => {
//
// }, { deep, immediate })
// 3. let stop = watchEffect(() => count.value + 3)
