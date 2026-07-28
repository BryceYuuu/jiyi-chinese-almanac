Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    term: {
      type: Object,
      value: null
    }
  },

  methods: {
    close() {
      this.triggerEvent("close");
    },

    stopPropagation() {},

    preventMove() {}
  }
});
