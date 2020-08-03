/**
 * 1、响应式 defineProperty/Proxy
 * 2、异步更新队列 nextTick
 * 3、computed、watch、effectWatch
 */
let active;

let effect = (fn, options = {}) => {
  let effect = (...args) => {
    try {
      active = effect;
      return fn(...args);
    } finally {
      active = null;
    }
  };
  effect.options = options
  return effect;
};

let watchEffect = (cb) => {
  let runner = effect(cb);
  runner();
};

let queue = [];
let nextTick = (cb) => Promise.resolve().then(cb);
let queueJob = (job) => {
  if (!queue.includes(job)) {
    queue.push(job);
    nextTick(flushJob);
  }
};
let flushJob = () => {
  let job;
  while ((job = queue.shift()) !== undefined) {
    job();
  }
};

class Dep {
  constructor() {
    this.deps = new Set();
  }
  depend() {
    active && this.deps.add(active);
  }
  notify() {
    this.deps.forEach((dep) => queueJob(dep));
    this.deps.forEach((dep) => {
      dep.options?.schedular && dep.options.schedular()
    })
  }
}

let ref = (initValue) => {
  let value = initValue;
  let dep = new Dep();

  return Object.defineProperty({}, "value", {
    get() {
      dep.depend();
      return value;
    },
    set(newValue) {
      value = newValue;
      dep.notify();
    },
  });
};

let computed = (fn) => {
  let value;
  let dirty = true;  // 脏数据重新计算，否则直接返回缓存值；

  let runner = effect(fn, {
    schedular: () => {
      if (!dirty) {
        dirty = true;
      }
    }
  })

  return {
    // get语法：将对象属性绑定到查询该属性时将被调用的函数。
    get value() {
      if (dirty) {
        value = runner();
        dirty = false;
      }
      return value;
    },
  };
};

let count = ref(0);
let computedValue = computed(() => count.value + 3);
document.getElementById("add").addEventListener("click", function () {
  count.value++;
});

watchEffect(() => {
  let str = `hello ${count.value} ${computedValue.value}`;
  // console.log(str);
  document.getElementById("app").innerText = str;
});
