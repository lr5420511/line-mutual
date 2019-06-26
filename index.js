'use strict';

const { AssertionError } = require('assert');
const { EventEmitter } = require('events');
const { Readable, Writable } = require('stream');
const promiseify = require('new-promiseify');

const once = promiseify([EventEmitter.prototype.once, 1, 1]);

const [BEFORE_MUTUAL, AFTER_MUTUAL] = ['before_mutual', 'after_mutual'];

const Mutual = module.exports = function(options) {
    let { inner, outer, decode } = Object.assign(this, {
        context: {},
        border: '*',
        borderLength: 110,
        decode: 'utf8'
    }, options);
    inner = this.inner = inner instanceof Readable ? inner : process.stdin;
    outer = this.outer = outer instanceof Writable ? outer : process.stdout;
    inner.setEncoding(decode);
    this.console = Object.assign(new console.__proto__.constructor(outer), {
        stream: outer
    });
    EventEmitter.call(this);
};

Mutual.prototype = Object.assign(Object.create(EventEmitter.prototype), {
    constructor: Mutual,
    next: async function() {
        const { context, inner, outer, console } = this,
            { mutuals, defaultAction } = Mutual,
            len = arguments.length;
        len && (console.log(...arguments));
        outer.write('\n> ');
        const command = await once.call(inner, 'data'),
            [n, ...args] = command.match(/[^ \r\n]+/g) || [],
            action = (mutuals[n - 1] && mutuals[n - 1][1]) || defaultAction;
        this.emit(BEFORE_MUTUAL, command, action, this);
        let res;
        try {
            res = await action(context, inner, console, ...(
                action === defaultAction ? [command, this.menu.bind(this)] : args
            ));
        } catch(err) {
            if(!(err instanceof AssertionError) && !err.forecastable) throw err;
            res = err;
        }
        this.emit(AFTER_MUTUAL, command, action, this, res);
        this.next(res);
    },
    menu: function() {
        const { border, borderLength } = this,
            { mkOrder, mutuals } = Mutual;
        return [
            border.repeat(borderLength),
            ...mkOrder(mutuals.map(cur => cur[0]), borderLength - 2)
                .map(cur => `  ${cur}`),
            border.repeat(borderLength)
        ].join('\n\n');
    }
});

Object.assign(Mutual, {
    mutuals: [],
    use: function(plugin) {
        const plugins = Mutual.plugins = Mutual.plugins || [];
        return (plugin(Mutual) || 1) && (plugins.push(plugin)) && Mutual;
    },
    mkOrder: function(records, len) {
        const re = /[^\x00-\xff]/g;
        return records.map((cur, i) => {
            cur = `${i + 1}. ${cur}`;
            let count = (cur.match(re) || []).length;
            count = cur.length + count - len;
            if(count > 0) {
                i = 0;
                while(count > 0 && (++i)) {
                    count = cur[cur.length - i].match(re) ? count - 2 : count - 1;
                }
                cur = cur.substring(0, cur.length - i);
            }
            return `${cur}${' '.repeat(Math.abs(count))}`;
        });
    },
    defaultAction: function(ctx, input, output, code, menu) {
        try {
            return Function('ctx', 'menu', `return ${code};`)(ctx, menu);
        } catch(err) {
            err.forecastable = true;
            throw err;
        }
    }
});