/* eslint-disable new-cap */
'use strict';

exports.__esModule = true;
exports.print = print;
exports.PrintVisitor = PrintVisitor;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _visitor = require('./visitor');

var _visitor2 = _interopRequireDefault(_visitor);

function print(ast) {
  return new PrintVisitor().accept(ast);
}

function PrintVisitor() {
  this.padding = 0;
}

PrintVisitor.prototype = new _visitor2['default']();

PrintVisitor.prototype.pad = function (string) {
  var out = '';

  for (var i = 0, l = this.padding; i < l; i++) {
    out += '  ';
  }

  out += string + '\n';
  return out;
};

PrintVisitor.prototype.Program = function (program) {
  var out = '',
      body = program.body,
      i = undefined,
      l = undefined;

  if (program.blockParams) {
    var blockParams = 'BLOCK PARAMS: [';
    for (i = 0, l = program.blockParams.length; i < l; i++) {
      blockParams += ' ' + program.blockParams[i];
    }
    blockParams += ' ]';
    out += this.pad(blockParams);
  }

  for (i = 0, l = body.length; i < l; i++) {
    out += this.accept(body[i]);
  }

  this.padding--;

  return out;
};

PrintVisitor.prototype.MustacheStatement = function (mustache) {
  return this.pad('{{ ' + this.SubExpression(mustache) + ' }}');
};
PrintVisitor.prototype.Decorator = function (mustache) {
  return this.pad('{{ DIRECTIVE ' + this.SubExpression(mustache) + ' }}');
};

PrintVisitor.prototype.BlockStatement = PrintVisitor.prototype.DecoratorBlock = function (block) {
  var out = '';

  out += this.pad((block.type === 'DecoratorBlock' ? 'DIRECTIVE ' : '') + 'BLOCK:');
  this.padding++;
  out += this.pad(this.SubExpression(block));
  if (block.program) {
    out += this.pad('PROGRAM:');
    this.padding++;
    out += this.accept(block.program);
    this.padding--;
  }
  if (block.inverse) {
    if (block.program) {
      this.padding++;
    }
    out += this.pad('{{^}}');
    this.padding++;
    out += this.accept(block.inverse);
    this.padding--;
    if (block.program) {
      this.padding--;
    }
  }
  this.padding--;

  return out;
};

PrintVisitor.prototype.PartialStatement = function (partial) {
  var content = 'PARTIAL:' + partial.name.original;
  if (partial.params[0]) {
    content += ' ' + this.accept(partial.params[0]);
  }
  if (partial.hash) {
    content += ' ' + this.accept(partial.hash);
  }
  return this.pad('{{> ' + content + ' }}');
};
PrintVisitor.prototype.PartialBlockStatement = function (partial) {
  var content = 'PARTIAL BLOCK:' + partial.name.original;
  if (partial.params[0]) {
    content += ' ' + this.accept(partial.params[0]);
  }
  if (partial.hash) {
    content += ' ' + this.accept(partial.hash);
  }

  content += ' ' + this.pad('PROGRAM:');
  this.padding++;
  content += this.accept(partial.program);
  this.padding--;

  return this.pad('{{> ' + content + ' }}');
};

PrintVisitor.prototype.ContentStatement = function (content) {
  return this.pad("CONTENT[ '" + content.value + "' ]");
};

PrintVisitor.prototype.CommentStatement = function (comment) {
  return this.pad("{{! '" + comment.value + "' }}");
};

PrintVisitor.prototype.SubExpression = function (sexpr) {
  var params = sexpr.params,
      paramStrings = [],
      hash = undefined;

  for (var i = 0, l = params.length; i < l; i++) {
    paramStrings.push(this.accept(params[i]));
  }

  params = '[' + paramStrings.join(', ') + ']';

  hash = sexpr.hash ? ' ' + this.accept(sexpr.hash) : '';

  return this.accept(sexpr.path) + ' ' + params + hash;
};

PrintVisitor.prototype.PathExpression = function (id) {
  var path = id.parts.join('/');
  return (id.data ? '@' : '') + 'PATH:' + path;
};

PrintVisitor.prototype.StringLiteral = function (string) {
  return '"' + string.value + '"';
};

PrintVisitor.prototype.NumberLiteral = function (number) {
  return 'NUMBER{' + number.value + '}';
};

PrintVisitor.prototype.BooleanLiteral = function (bool) {
  return 'BOOLEAN{' + bool.value + '}';
};

PrintVisitor.prototype.UndefinedLiteral = function () {
  return 'UNDEFINED';
};

PrintVisitor.prototype.NullLiteral = function () {
  return 'NULL';
};

PrintVisitor.prototype.Hash = function (hash) {
  var pairs = hash.pairs,
      joinedPairs = [];

  for (var i = 0, l = pairs.length; i < l; i++) {
    joinedPairs.push(this.accept(pairs[i]));
  }

  return 'HASH{' + joinedPairs.join(', ') + '}';
};
PrintVisitor.prototype.HashPair = function (pair) {
  return pair.key + '=' + this.accept(pair.value);
};
/* eslint-enable new-cap */
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9oYW5kbGViYXJzL2NvbXBpbGVyL3ByaW50ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozt1QkFDb0IsV0FBVzs7OztBQUV4QixTQUFTLEtBQUssQ0FBQyxHQUFHLEVBQUU7QUFDekIsU0FBTyxJQUFJLFlBQVksRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUN2Qzs7QUFFTSxTQUFTLFlBQVksR0FBRztBQUM3QixNQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztDQUNsQjs7QUFFRCxZQUFZLENBQUMsU0FBUyxHQUFHLDBCQUFhLENBQUM7O0FBRXZDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHLFVBQVMsTUFBTSxFQUFFO0FBQzVDLE1BQUksR0FBRyxHQUFHLEVBQUUsQ0FBQzs7QUFFYixPQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzVDLE9BQUcsSUFBSSxJQUFJLENBQUM7R0FDYjs7QUFFRCxLQUFHLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQztBQUNyQixTQUFPLEdBQUcsQ0FBQztDQUNaLENBQUM7O0FBRUYsWUFBWSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsVUFBUyxPQUFPLEVBQUU7QUFDakQsTUFBSSxHQUFHLEdBQUcsRUFBRTtNQUNWLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSTtNQUNuQixDQUFDLFlBQUE7TUFDRCxDQUFDLFlBQUEsQ0FBQzs7QUFFSixNQUFJLE9BQU8sQ0FBQyxXQUFXLEVBQUU7QUFDdkIsUUFBSSxXQUFXLEdBQUcsaUJBQWlCLENBQUM7QUFDcEMsU0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMs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LElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztHQUN6Qzs7QUFFRCxTQUFPLE9BQU8sR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztDQUMvQyxDQUFDO0FBQ0YsWUFBWSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsVUFBUyxJQUFJLEVBQUU7QUFDL0MsU0FBTyxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztDQUNqRCxDQUFDIiwiZmlsZSI6InByaW50ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBuZXctY2FwICovXG5pbXBvcnQgVmlzaXRvciBmcm9tICcuL3Zpc2l0b3InO1xuXG5leHBvcnQgZnVuY3Rpb24gcHJpbnQoYXN0KSB7XG4gIHJldHVybiBuZXcgUHJpbnRWaXNpdG9yKCkuYWNjZXB0KGFzdCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBQcmludFZpc2l0b3IoKSB7XG4gIHRoaXMucGFkZGluZyA9IDA7XG59XG5cblByaW50VmlzaXRvci5wcm90b3R5cGUgPSBuZXcgVmlzaXRvcigpO1xuXG5QcmludFZpc2l0b3IucHJvdG90eXBlLnBhZCA9IGZ1bmN0aW9uKHN0cmluZykge1xuICBsZXQgb3V0ID0gJyc7XG5cbiAgZm9yIChsZXQgaSA9IDAsIGwgPSB0aGlzLnBhZGRpbmc7IGkgPCBsOyBpKyspIHtcbiAgICBvdXQgKz0gJyAgJztcbiAgfVxuXG4gIG91dCArPSBzdHJpbmcgKyAnXFxuJztcbiAgcmV0dXJuIG91dDtcbn07XG5cblByaW50VmlzaXRvci5wcm90b3R5cGUuUHJvZ3JhbSA9IGZ1bmN0aW9uKHByb2dyYW0pIHtcbiAgbGV0IG91dCA9ICcnLFxuICAgIGJvZHkgPSBwcm9ncmFtLmJvZHksXG4gICAgaSxcbiAgICBsO1xuXG4gIGlmIChwcm9ncmFtLmJsb2NrUGFyYW1zKSB7XG4gICAgbGV0IGJsb2NrUGFyYW1zID0gJ0JMT0NLIFBBUkFNUzogWyc7XG4gICAgZm9yIChpID0gMCwgbCA9IHByb2dyYW0uYmxvY2tQYXJhbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBibG9ja1BhcmFtcyArPSAnICcgKyBwcm9ncmFtLmJsb2NrUGFyYW1zW2ldO1xuICAgIH1cbiAgICBibG9ja1BhcmFtcyArPSAnIF0nO1xuICAgIG91dCArPSB0aGlzLnBhZChibG9ja1BhcmFtcyk7XG4gIH1cblxuICBmb3IgKGkgPSAwLCBsID0gYm9keS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBvdXQgKz0gdGhpcy5hY2NlcHQoYm9keVtpXSk7XG4gIH1cblxuICB0aGlzLnBhZGRpbmctLTtcblxuICByZXR1cm4gb3V0O1xufTtcblxuUHJpbnRWaXNpdG9yLnByb3RvdHlwZS5NdXN0YWNoZVN0YXRlbWVudCA9IGZ1bmN0aW9uKG11c3RhY2hlKSB7XG4gIHJldHVybiB0aGlzLnBhZCgne3sgJyArIHRoaXMuU3ViRXhwcmVzc2lvbihtdXN0YWNoZSkgKyAnIH19Jyk7XG59O1xuUHJpbnRWaXNpdG9yLnByb3RvdHlwZS5EZWNvcmF0b3IgPSBmdW5jdGlvbihtdXN0YWNoZSkge1xuICByZXR1cm4gdGhpcy5wYWQoJ3t7IERJUkVDVElWRSAnICsgdGhpcy5TdWJFeHByZXNzaW9uKG11c3RhY2hlKSArICcgfX0nKTtcbn07XG5cblByaW50VmlzaXRvci5wcm90b3R5cGUuQmxvY2tTdGF0ZW1lbnQgPSBQcmludFZpc2l0b3IucHJvdG90eXBlLkRlY29yYXRvckJsb2NrID0gZnVuY3Rpb24oXG4gIGJsb2NrXG4pIHtcbiAgbGV0IG91dCA9ICcnO1xuXG4gIG91dCArPSB0aGlzLnBhZChcbiAgICAoYmxvY2sudHlwZSA9PT0gJ0RlY29yYXRvckJsb2NrJyA/ICdESVJFQ1RJVkUgJyA6ICcnKSArICdCTE9DSzonXG4gICk7XG4gIHRoaXMucGFkZGluZysrO1xuICBvdXQgKz0gdGhpcy5wYWQodGhpcy5TdWJFeHByZXNzaW9uKGJsb2NrKSk7XG4gIGlmIChibG9jay5wcm9ncmFtKSB7XG4gICAgb3V0ICs9IHRoaXMucGFkKCdQUk9HUkFNOicpO1xuICAgIHRoaXMucGFkZGluZysrO1xuICAgIG91dCArPSB0aGlzLmFjY2VwdChibG9jay5wcm9ncmFtKTtcbiAgICB0aGlzLnBhZGRpbmctLTtcbiAgfVxuICBpZiAoYmxvY2suaW52ZXJzZSkge1xuICAgIGlmIChibG9jay5wcm9ncmFtKSB7XG4gICAgICB0aGlzLnBhZGRpbmcrKztcbiAgICB9XG4gICAgb3V0ICs9IHRoaXMucGFkKCd7e159fScpO1xuICAgIHRoaXMucGFkZGluZysrO1xuICAgIG91dCArPSB0aGlzLmFjY2VwdChibG9jay5pbnZlcnNlKTtcbiAgICB0aGlzLnBhZGRpbmctLTtcbiAgICBpZiAoYmxvY2sucHJvZ3JhbSkge1xuICAgICAgdGhpcy5wYWRkaW5nLS07XG4gICAgfVxuICB9XG4gIHRoaXMucGFkZGluZy0tO1xuXG4gIHJldHVybiBvdXQ7XG59O1xuXG5QcmludFZpc2l0b3IucHJvdG90eXBlLlBhcnRpYWxTdGF0ZW1lbnQgPSBmdW5jdGlvbihwYXJ0aWFsKSB7XG4gIGxldCBjb250ZW50ID0gJ1BBUlRJQUw6JyArIHBhcnRpYWwubmFtZS5vcmlnaW5hbDtcbiAgaWYgKHBhcnRpYWwucGFyYW1zWzBdKSB7XG4gICAgY29udGVudCArPSAnICcgKyB0aGlzLmFjY2VwdChwYXJ0aWFsLnBhcmFtc1swXSk7XG4gIH1cbiAgaWYgKHBhcnRpYWwuaGFzaCkge1xuICAgIGNvbnRlbnQgKz0gJyAnICsgdGhpcy5hY2NlcHQocGFydGlhbC5oYXNoKTtcbiAgfVxuICByZXR1cm4gdGhpcy5wYWQoJ3t7PiAnICsgY29udGVudCArICcgfX0nKTtcbn07XG5QcmludFZpc2l0b3IucHJvdG90eXBlLlBhcnRpYWxCbG9ja1N0YXRlbWVudCA9IGZ1bmN0aW9uKHBhcnRpYWwpIHtcbiAgbGV0IGNvbnRlbnQgPSAnUEFSVElBTCBCTE9DSzonICsgcGFydGlhbC5uYW1lLm9yaWdpbmFsO1xuICBpZiAocGFydGlhbC5wYXJhbXNbMF0pIHtcbiAgICBjb250ZW50ICs9ICcgJyArIHRoaXMuYWNjZXB0KHBhcnRpYWwucGFyYW1zWzBdKTtcbiAgfVxuICBpZiAocGFydGlhbC5oYXNoKSB7XG4gICAgY29udGVudCArPSAnICcgKyB0aGlzLmFjY2VwdChwYXJ0aWFsLmhhc2gpO1xuICB9XG5cbiAgY29udGVudCArPSAnICcgKyB0aGlzLnBhZCgnUFJPR1JBTTonKTtcbiAgdGhpcy5wYWRkaW5nKys7XG4gIGNvbnRlbnQgKz0gdGhpcy5hY2NlcHQocGFydGlhbC5wcm9ncmFtKTtcbiAgdGhpcy5wYWRkaW5nLS07XG5cbiAgcmV0dXJuIHRoaXMucGFkKCd7ez4gJyArIGNvbnRlbnQgKyAnIH19Jyk7XG59O1xuXG5QcmludFZpc2l0b3IucHJvdG90eXBlLkNvbnRlbnRTdGF0ZW1lbnQgPSBmdW5jdGlvbihjb250ZW50KSB7XG4gIHJldHVybiB0aGlzLnBhZChcIkNPTlRFTlRbICdcIiArIGNvbnRlbnQudmFsdWUgKyBcIicgXVwiKTtcbn07XG5cblByaW50VmlzaXRvci5wcm90b3R5cGUuQ29tbWVudFN0YXRlbWVudCA9IGZ1bmN0aW9uKGNvbW1lbnQpIHtcbiAgcmV0dXJuIHRoaXMucGFkKFwie3shICdcIiArIGNvbW1lbnQudmFsdWUgKyBcIicgfX1cIik7XG59O1xuXG5QcmludFZpc2l0b3IucHJvdG90eXBlLlN1YkV4cHJlc3Npb24gPSBmdW5jdGlvbihzZXhwcikge1xuICBsZXQgcGFyYW1zID0gc2V4cHIucGFyYW1zLFxuICAgIHBhcmFtU3RyaW5ncyA9IFtdLFxuICAgIGhhc2g7XG5cbiAgZm9yIChsZXQgaSA9IDAsIGwgPSBwYXJhbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgcGFyYW1TdHJpbmdzLnB1c2godGhpcy5hY2NlcHQocGFyYW1zW2ldKSk7XG4gIH1cblxuICBwYXJhbXMgPSAnWycgKyBwYXJhbVN0cmluZ3Muam9pbignLCAnKSArICddJztcblxuICBoYXNoID0gc2V4cHIuaGFzaCA/ICcgJyArIHRoaXMuYWNjZXB0KHNleHByLmhhc2gpIDogJyc7XG5cbiAgcmV0dXJuIHRoaXMuYWNjZXB0KHNleHByLnBhdGgpICsgJyAnICsgcGFyYW1zICsgaGFzaDtcbn07XG5cblByaW50VmlzaXRvci5wcm90b3R5cGUuUGF0aEV4cHJlc3Npb24gPSBmdW5jdGlvbihpZCkge1xuICBsZXQgcGF0aCA9IGlkLnBhcnRzLmpvaW4oJy8nKTtcbiAgcmV0dXJuIChpZC5kYXRhID8gJ0AnIDogJycpICsgJ1BBVEg6JyArIHBhdGg7XG59O1xuXG5QcmludFZpc2l0b3IucHJvdG90eXBlLlN0cmluZ0xpdGVyYWwgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgcmV0dXJuICdcIicgKyBzdHJpbmcudmFsdWUgKyAnXCInO1xufTtcblxuUHJpbnRWaXNpdG9yLnByb3RvdHlwZS5OdW1iZXJMaXRlcmFsID0gZnVuY3Rpb24obnVtYmVyKSB7XG4gIHJldHVybiAnTlVNQkVSeycgKyBudW1iZXIudmFsdWUgKyAnfSc7XG59O1xuXG5QcmludFZpc2l0b3IucHJvdG90eXBlLkJvb2xlYW5MaXRlcmFsID0gZnVuY3Rpb24oYm9vbCkge1xuICByZXR1cm4gJ0JPT0xFQU57JyArIGJvb2wudmFsdWUgKyAnfSc7XG59O1xuXG5QcmludFZpc2l0b3IucHJvdG90eXBlLlVuZGVmaW5lZExpdGVyYWwgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICdVTkRFRklORUQnO1xufTtcblxuUHJpbnRWaXNpdG9yLnByb3RvdHlwZS5OdWxsTGl0ZXJhbCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gJ05VTEwnO1xufTtcblxuUHJpbnRWaXNpdG9yLnByb3RvdHlwZS5IYXNoID0gZnVuY3Rpb24oaGFzaCkge1xuICBsZXQgcGFpcnMgPSBoYXNoLnBhaXJzLFxuICAgIGpvaW5lZFBhaXJzID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDAsIGwgPSBwYWlycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBqb2luZWRQYWlycy5wdXNoKHRoaXMuYWNjZXB0KHBhaXJzW2ldKSk7XG4gIH1cblxuICByZXR1cm4gJ0hBU0h7JyArIGpvaW5lZFBhaXJzLmpvaW4oJywgJykgKyAnfSc7XG59O1xuUHJpbnRWaXNpdG9yLnByb3RvdHlwZS5IYXNoUGFpciA9IGZ1bmN0aW9uKHBhaXIpIHtcbiAgcmV0dXJuIHBhaXIua2V5ICsgJz0nICsgdGhpcy5hY2NlcHQocGFpci52YWx1ZSk7XG59O1xuLyogZXNsaW50LWVuYWJsZSBuZXctY2FwICovXG4iXX0=
