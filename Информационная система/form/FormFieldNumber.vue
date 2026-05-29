<template>
    <div class="form-field-number">
        <input
            :id="uuid + '-field-' + field.type"
            class="admin-input"
            type="number"
            v-model="value"
            :min="field.min"
            :max="field.max"
            :step="field.step || `${1 / Math.pow(10, field.accuracy || 0)}`"
            :list="uuid + '-datalist'"
            :placeholder="field.placeholder"
            :title="field.placeholder"
            @input="$parent.isValid()" />

        <button
            type="button"
            class="form-field-button decrease"
            title="уменьшить, ctrl - x10, alt - x100"
            @click="decrease($event)"
            @pointerdown="startDecrease()"
            @pointerup="stopDecrease()"
            @pointerleave="stopDecrease()">

            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M200-440v-80h560v80H200Z"/></svg>
        </button>

        <button
            type="button"
            class="form-field-button increase"
            title="увеличить, ctrl - x10, alt - x100"
            @click="increase($event)"
            @pointerdown="startIncrease()"
            @pointerup="stopIncrease()"
            @pointerleave="stopIncrease()">

            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>
        </button>

        <datalist v-if="field.suggestions" :id="uuid + '-datalist'">
            <option v-for="suggestion in field.suggestions" :key="suggestion">{{ suggestion }}</option>
        </datalist>
    </div>
</template>


<script>
/**
 * returns {@link number}
 *
 * @typedef {Object} field
 *
 * @property {'number'} type
 * @property {string} [placeholder]
 * @property {string[]} [suggestions] - suggestions displayed as datalist
 * @property {string[]} [reserved] - whole values that may not be entered
 * @property {number} [min]
 * @property {number} [max]
 * @property {number} [step]
 * @property {number} [accuracy] - number of digits after the decimal point (only if step is not specified)
 */

export default {
    name: 'FormFieldNumber',

    props: {
        /** @type {() => field} */
        field: Object,
        uuid: String
    },

    data () {
        return {
            value: this.field.initial || '',

            min: this.field.min || -Infinity,
            max: this.field.max || Infinity,
            step: this.field.step || 1,

            incrIds: [],
            decrIds: [],
        }
    },

    watch: {
        field: function () { this.value = this.field.initial || '' },
    },

    methods: {
        clear () { this.value = this.field.initial || '' },
        collectInitial () { return parseFloat(this.field.initial) || 0 },
        collect () { return parseFloat(this.value) || 0 },

        async startIncrease () {
            this.incrIds.push(setTimeout(() => {
                this.incrIds.push(setInterval(() => {
                    this.increase()
                }, 25))
            }, 400))
        },

        stopIncrease () {
            this.incrIds.forEach(id => clearTimeout(id) || clearInterval(id))
        },

        async startDecrease () {
            this.decrIds.push(setTimeout(() => {
                this.decrIds.push(setInterval(() => {
                    this.decrease()
                }, 25))
            }, 400))
        },

        stopDecrease () {
            this.decrIds.forEach(id => clearTimeout(id) || clearInterval(id))
        },

        increase (event = null) {
            let mod = 1

            if (event?.ctrlKey) mod *= 10
            if (event?.altKey) mod *= 100

            this.value = (parseFloat(this.value) || 0) + this.step * mod
            this.$parent.isValid()
        },

        decrease (event = null) {
            let mod = 1

            if (event?.ctrlKey) mod *= 10
            if (event?.altKey) mod *= 100

            this.value = (parseFloat(this.value) || 0) - this.step * mod
            this.$parent.isValid()
        },

        isValid () {
            if (this.value < this.min) {
                return `Значение должно быть больше или равно ${this.min}`
            }

            if (this.value > this.max) {
                return `Значение должно быть меньше или равно ${this.max}`
            }

            if (this.field.reserved && this.field.reserved.includes(this.value)) {
                return 'Это значение недоступно, попробуйте другое'
            }

            return true
        },

        isEmpty () { return !this.value },
        onEmpty: () => 'Поле не должно быть равным нулю'
    }
}
</script>


<style scoped>
.form-field-number {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    gap: 6px;
    width: 100%;
}

.form-field-number > .admin-input {
    flex-shrink: 1;
}

.form-field-button {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    min-width: 40px;
    max-width: 40px;
    height: 40px;
    min-height: 40px;
    max-height: 40px;
    padding: 0;
    border-radius: 4px;
    background: #F1F1F1;
    fill: #666;
    user-select: none;
    transition: .25s;
}
.form-field-button.increase:hover {
    background: #dbebd8;
    fill: #168100;
}
.form-field-button.decrease:hover {
    background: #e7d1df;
    fill: #850052;
}
.form-field-button:active {
    box-shadow: 0 0 4px 0 #999;
}
</style>
