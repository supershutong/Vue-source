let x
let active
let watch = cb => {
  active = cb
  active()
  active = null
}

class Dep {
  deps = new Set()
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

x = ref(1)

watch(() => {
  console.log(`hello ${x.value} `)
})

x.value = 2
x.value = 3
