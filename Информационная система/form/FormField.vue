<template>
    <section
        ref="container"
        class="form-field-container"
        :class="{
            [messageType]: true,
            included,
            readonly: field.readonly
        }">

        <div
            class="form-field-header"
            :title="
                field.readonly ? 'поле только для просмотра' :
                field.required ? 'поле обязательно для заполнения' : null
            ">

            <label
                :for="uuid + '-field-' + field.type"
                class="form-field-label">

                <input
                    v-if="field.optional"
                    type="checkbox"
                    class="admin-checkbox-input"
                    v-model="included" />

                <span>{{ field.name }}</span>
            </label>

            <svg v-if="field.readonly" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M764-85 509-339 290-120H120v-170l219-219L85-763l57-57 679 679-57 56ZM424-424l-28-28 28 28 28 28-28-28Zm199-29-57-57 35-35-56-56-35 35-57-57 91-91 170 170-91 91Zm149-150L602-771l56-56q23-23 56.5-23t56.5 23l56 56q23 23 24 55.5T829-660l-57 57Zm-234 65ZM200-200h56l196-196-56-56-196 196v56Z"/></svg>
            <svg v-else-if="field.required" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M435.001-154.001v-248.308L220.462-278.463l-44.999-78.075L390.001-480 175.463-603.462l44.999-78.075 214.539 123.846v-248.308h89.998v248.308l214.539-123.846 44.999 78.075L569.999-480l214.538 123.462-44.999 78.075-214.539-123.846v248.308h-89.998Z"/></svg>
        </div>

        <div v-if="field.description" class="form-field-description">
            {{ field.description }}
        </div>

        <div class="form-field-content">
            <component
                ref="field"
                :is="'form-field-' + (this.field.type || 'text').toLowerCase()"
                :field="field"
                :uuid="uuid"/>
        </div>

        <div
            v-if="
                settings.hasMessage &&
                (field.mayDisplay || [ 'error' ]).includes(messageType)
            "
            class="form-field-message"
            :class="messageType"
            v-html="messageOf(messageType)">
        </div>
    </section>
</template>


<script>
import { uuidv4 } from '~/plugins/scripts/utils'

export default {
    name: 'FormField',

    props: [ 'identifier', 'field' ],

    data: function () {
        this.field.__vue__ = this

        return {
            uuid: uuidv4(),
            included: this.field.optional ? !!this.field.initial : true,
            messageType: 'invitation',
            message: this.messageOf('invitation'),
            settings: {
                hasState: true,
                hasMessage: true
            }
        }
    },

    watch: {
        messageType () {
            try {
                this.$parent.setState(this.identifier, {
                    checked: this.messageType !== 'error',
                    name: this.field.name,
                    state: this.messageType
                })
            }
            catch {}
        },

        included () {
            try {
                this.$parent.setState(this.identifier, {
                    checked: this.messageType !== 'error',
                    name: this.field.name,
                    state: this.messageType
                })
            }
            catch {}
        }
    },

    mounted: function () {
        try { this.check() } catch {}

        let settings = {}

        try { settings = this.$refs.field._settings() } catch {}
        this.settings.hasState   = settings.hasState   ?? true
        this.settings.hasMessage = settings.hasMessage ?? true

        if (this.field.readonly) this.settings.hasState = false

        if (!this.settings.hasState) try {
            this.$parent.removeState(this.identifier)
        } catch {}
    },

    methods: {
        clear () { this.$refs.field.clear() },
        collect () {
            return (
                this.readonly ? this.$refs.field?.collectInitial() :
                this.included ? this.$refs.field?.collect() : undefined
            )
        },

        isValid () {
            try { this.$parent.group._changed = true } catch {}

            if (!this.included || this.field.readonly) {
                this.messageType = 'readonly'
                return true
            }

            if (this.$refs.field.isEmpty()) {
                if (this.field.required) {
                    this.messageType = 'error'
                    this.message = this.$refs.field.onEmpty()
                    return false
                }
                else {
                    this.messageType = 'invitation'
                    return true
                }
            }

            if (this.$refs.field.isValid) {
                const result = this.$refs.field.isValid()
                if (result !== true) {
                    this.messageType = 'error'
                    this.message = result
                    return false
                }
            }

            if (this.field.customCheck) {
                let result

                if (typeof this.field.customCheck === 'function') {
                    result = this.field.customCheck(this.$refs.field.value)
                }

                else if (Array.isArray(this.field.customCheck)) {
                    for (const check of this.field.customCheck) {
                        result = check(this.$refs.field.value)
                        if (result !== true) break
                    }
                }

                if (result !== true) {
                    this.messageType = 'error'
                    this.message = result
                    return false
                }
            }

            this.messageType = 'success'
            return true
        },

        isEmpty () { return this.$refs.field.isEmpty() },


        /** only rich field.options based */
        resolveInitial () {
            if (this.field.initial == null) return null

            else if (typeof this.field.initial === 'object') {
                for (const key in this.field.options) {
                    const value = this.field.options[key]

                    if (value?.id === this.field.initial?.id) return { key, value }
                }
            }

            else {
                for (const key in this.field.options) {
                    const value = this.field.options[key]

                    if (
                        value === this.field.initial ||
                        value?.id === this.field.initial
                    ) return { key, value }
                }

                const v = this.field.options[this.field.initial]
                return v ? { key: this.field.initial, value: v } : null
            }

            return null
        },

        scrollIntoView () {
            this.$refs.container.scrollIntoView({ behavior: 'smooth', block: 'center' })
            this.$refs.container.classList.add('highlighted')
            setTimeout(() => { this.$refs.container.classList.remove('highlighted') }, 2000)
        },

        messageOf (messageType) {
            switch (messageType) {
                case 'error': return this.message || ''
                case 'invitation': return 'Введите что-нибудь или оставьте пустым'
                case 'readonly': return 'Поле <b>не</b> редактируется'
                case 'success': return 'Всё в порядке'
            }
        }
    }
}
</script>


<style scoped>
.form-field-container {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 10px;
    box-sizing: border-box;
    width: 100%;
    padding: 10px;
    border-radius: 10px;
    background: #FFF;
    box-shadow: 0 1px 4px 0 #666;
    outline: 4px solid transparent;
    outline-offset: 0;
    transition: .3s;
}
.form-field-container.error {
    box-shadow: 0 1px 3px 1px #ff4500;
}

.form-field-container:not(.included) {
    opacity: .5;
}
.form-field-container:not(.included) {
    pointer-events: none;
}
.form-field-container:not(.included) .admin-checkbox-input {
    pointer-events: all;
}

.form-field-container.readonly {
    opacity: .75;
    pointer-events: none;
}

.form-field-container.highlighted {
    /* outline-color: #ffee00; */ /* poor visibility with achromatopsia / colour blindness */
    outline-color: #632700;
    outline-offset: 6px;
}

.form-field-header {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    gap: 4px;
    width: 100%;
}

    .form-field-label {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        justify-content: flex-start;
        align-items: center;
        gap: 10px;
        box-sizing: border-box;
        width: 100%;
        color: #000;
        font-size: 18px;
        font-weight: bold;
    }

    .form-field-header > svg {
        width: 24px;
        min-width: 24px;
        max-width: 24px;
        height: 24px;
        min-height: 24px;
        max-height: 24px;
        fill: #ff4500;
    }

.form-field-description {
    color: #888;
    font-size: 14px;
}

.form-field-content {
    width: 100%;
}

.form-field-message {
    box-sizing: border-box;
    width: 100%;
    padding: 6px 12px;
    border-radius: 6px;
    background: #F5F5F5;
    color: #666;
    font-size: 16px;
    vertical-align: middle;
    transition: .25s;
}
.form-field-message::before {
    display: inline-block;
    width: 20px;
    height: 20px;
}

    .form-field-message.invitation {
        background: #e8f8ff;
        color:#006086;
    }
    .form-field-message.invitation::before {
        content: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%23006086" height="18" viewBox="0 -960 960 960" width="18"><path d="M280-420q25 0 42.5-17.5T340-480q0-25-17.5-42.5T280-540q-25 0-42.5 17.5T220-480q0 25 17.5 42.5T280-420Zm200 0q25 0 42.5-17.5T540-480q0-25-17.5-42.5T480-540q-25 0-42.5 17.5T420-480q0 25 17.5 42.5T480-420Zm200 0q25 0 42.5-17.5T740-480q0-25-17.5-42.5T680-540q-25 0-42.5 17.5T620-480q0 25 17.5 42.5T680-420ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>');
    }

    .form-field-message.success {
        background: #e8ffed;
        color:#008621;
    }
    .form-field-message.success::before {
        content: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%23008621" height="18" viewBox="0 -960 960 960" width="18"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>');
    }

    .form-field-message.error {
        background: #ffeee8;
        color:#862400;
    }
    .form-field-message.error::before {
        content: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%23862400" height="18" viewBox="0 -960 960 960" width="18"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>');
    }

    .form-field-message.readonly {
        background: #e8fff5;
        color:#008664;
    }
    .form-field-message.readonly::before {
        content: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%23008664" height="18" viewBox="0 -960 960 960" width="18"><path d="M764-85 509-339 290-120H120v-170l219-219L85-763l57-57 679 679-57 56ZM424-424l-28-28 28 28 28 28-28-28Zm199-29-57-57 35-35-56-56-35 35-57-57 91-91 170 170-91 91Zm149-150L602-771l56-56q23-23 56.5-23t56.5 23l56 56q23 23 24 55.5T829-660l-57 57Zm-234 65ZM200-200h56l196-196-56-56-196 196v56Z"/></svg>');
    }
</style>
