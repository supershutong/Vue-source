let active
let watch = cb => {
  active = cb
  active()
  active = null
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
    this.deps.forEach(dep => dep())
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
let z = ref(3)
watch(() => {
  console.log(`hello ${x.value} ${y.value} ${z.value} `)
})

x.value = 2
y.value = 3
z.value = 3
