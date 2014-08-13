library boundaries_estimation_dart.web.boundaries_estimation_dart.generated_static_injector;

import 'package:di/di.dart';
import 'package:di/static_injector.dart';

import 'boundaries_estimation_dart.dart' as import_0;
import 'package:angular/core/module_internal.dart' as import_1;
import 'package:di/di.dart' as import_2;
import 'package:angular/core/registry.dart' as import_3;
import 'package:angular/core/parser/parser.dart' as import_5;
import 'package:angular/change_detection/change_detection.dart' as import_6;
import 'package:angular/core/parser/dynamic_parser.dart' as import_7;
import 'package:angular/core/parser/lexer.dart' as import_8;
import 'package:angular/core_dom/module_internal.dart' as import_9;
import 'dart:html' as import_10;
import 'package:perf_api/perf_api.dart' as import_11;
import 'package:angular/directive/module.dart' as import_12;
import 'package:angular/formatter/module_internal.dart' as import_13;
import 'package:angular/routing/module.dart' as import_14;
import 'package:route_hierarchical/client.dart' as import_15;
import 'package:angular/application.dart' as import_16;
Injector createStaticInjector({List<Module> modules, String name,
    bool allowImplicitInjection: false}) =>
  new StaticInjector(modules: modules, name: name,
      allowImplicitInjection: allowImplicitInjection,
      typeFactories: factories);

final Map<Type, TypeFactory> factories = <Type, TypeFactory>{
  import_0.BoundariesEstimationController: (f) => new import_0.BoundariesEstimationController(),
  import_1.ExceptionHandler: (f) => new import_1.ExceptionHandler(),
  import_1.FormatterMap: (f) => new import_1.FormatterMap(f(import_2.Injector), f(import_3.MetadataExtractor)),
  import_1.Interpolate: (f) => new import_1.Interpolate(),
  import_1.ScopeDigestTTL: (f) => new import_1.ScopeDigestTTL(),
  import_1.ScopeStats: (f) => new import_1.ScopeStats(f(import_1.ScopeStatsEmitter), f(import_1.ScopeStatsConfig)),
  import_1.ScopeStatsEmitter: (f) => new import_1.ScopeStatsEmitter(),
  import_1.RootScope: (f) => new import_1.RootScope(f(Object), f(import_5.Parser), f(import_6.FieldGetterFactory), f(import_1.FormatterMap), f(import_1.ExceptionHandler), f(import_1.ScopeDigestTTL), f(import_1.VmTurnZone), f(import_1.ScopeStats), f(import_7.ClosureMap)),
  import_7.DynamicParser: (f) => new import_7.DynamicParser(f(import_8.Lexer), f(import_5.ParserBackend)),
  import_7.DynamicParserBackend: (f) => new import_7.DynamicParserBackend(f(import_7.ClosureMap)),
  import_8.Lexer: (f) => new import_8.Lexer(),
  import_9.Animate: (f) => new import_9.Animate(),
  import_9.ViewCache: (f) => new import_9.ViewCache(f(import_9.Http), f(import_9.TemplateCache), f(import_9.Compiler), f(import_10.NodeTreeSanitizer)),
  import_9.BrowserCookies: (f) => new import_9.BrowserCookies(f(import_1.ExceptionHandler)),
  import_9.Cookies: (f) => new import_9.Cookies(f(import_9.BrowserCookies)),
  import_9.DirectiveMap: (f) => new import_9.DirectiveMap(f(import_2.Injector), f(import_3.MetadataExtractor), f(import_9.DirectiveSelectorFactory)),
  import_9.ElementBinderFactory: (f) => new import_9.ElementBinderFactory(f(import_5.Parser), f(import_11.Profiler), f(Expando), f(import_9.ComponentFactory), f(import_9.TranscludingComponentFactory), f(import_9.ShadowDomComponentFactory)),
  import_9.EventHandler: (f) => new import_9.EventHandler(f(import_10.Node), f(Expando), f(import_1.ExceptionHandler)),
  import_9.ShadowRootEventHandler: (f) => new import_9.ShadowRootEventHandler(f(import_10.ShadowRoot), f(Expando), f(import_1.ExceptionHandler)),
  import_9.UrlRewriter: (f) => new import_9.UrlRewriter(),
  import_9.HttpBackend: (f) => new import_9.HttpBackend(),
  import_9.LocationWrapper: (f) => new import_9.LocationWrapper(),
  import_9.HttpInterceptors: (f) => new import_9.HttpInterceptors(),
  import_9.HttpDefaultHeaders: (f) => new import_9.HttpDefaultHeaders(),
  import_9.HttpDefaults: (f) => new import_9.HttpDefaults(f(import_9.HttpDefaultHeaders)),
  import_9.Http: (f) => new import_9.Http(f(import_9.BrowserCookies), f(import_9.LocationWrapper), f(import_9.UrlRewriter), f(import_9.HttpBackend), f(import_9.HttpDefaults), f(import_9.HttpInterceptors)),
  import_9.TextMustache: (f) => new import_9.TextMustache(f(import_10.Node), f(String), f(import_1.Interpolate), f(import_1.Scope), f(import_1.FormatterMap)),
  import_9.AttrMustache: (f) => new import_9.AttrMustache(f(import_9.NodeAttrs), f(String), f(import_1.Interpolate), f(import_1.Scope), f(import_1.FormatterMap)),
  import_9.WebPlatform: (f) => new import_9.WebPlatform(),
  import_9.DirectiveSelectorFactory: (f) => new import_9.DirectiveSelectorFactory(f(import_9.ElementBinderFactory)),
  import_9.ShadowDomComponentFactory: (f) => new import_9.ShadowDomComponentFactory(f(Expando)),
  import_9.ComponentCssRewriter: (f) => new import_9.ComponentCssRewriter(),
  import_9.TaggingCompiler: (f) => new import_9.TaggingCompiler(f(import_11.Profiler), f(Expando)),
  import_9.Content: (f) => new import_9.Content(f(import_9.ContentPort), f(import_10.Element)),
  import_9.TranscludingComponentFactory: (f) => new import_9.TranscludingComponentFactory(f(Expando)),
  import_9.NullTreeSanitizer: (f) => new import_9.NullTreeSanitizer(),
  import_9.WalkingCompiler: (f) => new import_9.WalkingCompiler(f(import_11.Profiler), f(Expando)),
  import_9.NgElement: (f) => new import_9.NgElement(f(import_10.Element), f(import_1.Scope), f(import_9.Animate)),
  import_12.AHref: (f) => new import_12.AHref(f(import_10.Element), f(import_1.VmTurnZone)),
  import_12.NgBaseCss: (f) => new import_12.NgBaseCss(),
  import_12.NgBind: (f) => new import_12.NgBind(f(import_10.Element)),
  import_12.NgBindHtml: (f) => new import_12.NgBindHtml(f(import_10.Element), f(import_10.NodeValidator)),
  import_12.NgBindTemplate: (f) => new import_12.NgBindTemplate(f(import_10.Element)),
  import_12.NgClass: (f) => new import_12.NgClass(f(import_9.NgElement), f(import_1.Scope), f(import_9.NodeAttrs)),
  import_12.NgClassOdd: (f) => new import_12.NgClassOdd(f(import_9.NgElement), f(import_1.Scope), f(import_9.NodeAttrs)),
  import_12.NgClassEven: (f) => new import_12.NgClassEven(f(import_9.NgElement), f(import_1.Scope), f(import_9.NodeAttrs)),
  import_12.NgEvent: (f) => new import_12.NgEvent(f(import_10.Element), f(import_1.Scope)),
  import_12.NgCloak: (f) => new import_12.NgCloak(f(import_10.Element), f(import_9.Animate)),
  import_12.NgIf: (f) => new import_12.NgIf(f(import_9.BoundViewFactory), f(import_9.ViewPort), f(import_1.Scope)),
  import_12.NgUnless: (f) => new import_12.NgUnless(f(import_9.BoundViewFactory), f(import_9.ViewPort), f(import_1.Scope)),
  import_12.NgInclude: (f) => new import_12.NgInclude(f(import_10.Element), f(import_1.Scope), f(import_9.ViewCache), f(import_2.Injector), f(import_9.DirectiveMap)),
  import_12.NgModel: (f) => new import_12.NgModel(f(import_1.Scope), f(import_9.NgElement), f(import_2.Injector), f(import_9.NodeAttrs), f(import_9.Animate)),
  import_12.InputCheckbox: (f) => new import_12.InputCheckbox(f(import_10.Element), f(import_12.NgModel), f(import_1.Scope), f(import_12.NgTrueValue), f(import_12.NgFalseValue), f(import_12.NgModelOptions)),
  import_12.InputTextLike: (f) => new import_12.InputTextLike(f(import_10.Element), f(import_12.NgModel), f(import_1.Scope), f(import_12.NgModelOptions)),
  import_12.InputNumberLike: (f) => new import_12.InputNumberLike(f(import_10.Element), f(import_12.NgModel), f(import_1.Scope), f(import_12.NgModelOptions)),
  import_12.NgBindTypeForDateLike: (f) => new import_12.NgBindTypeForDateLike(f(import_10.Element)),
  import_12.InputDateLike: (f) => new import_12.InputDateLike(f(import_10.Element), f(import_12.NgModel), f(import_1.Scope), f(import_12.NgBindTypeForDateLike), f(import_12.NgModelOptions)),
  import_12.NgValue: (f) => new import_12.NgValue(f(import_10.Element)),
  import_12.NgTrueValue: (f) => new import_12.NgTrueValue(f(import_10.Element)),
  import_12.NgFalseValue: (f) => new import_12.NgFalseValue(f(import_10.Element)),
  import_12.InputRadio: (f) => new import_12.InputRadio(f(import_10.Element), f(import_12.NgModel), f(import_1.Scope), f(import_12.NgValue), f(import_9.NodeAttrs)),
  import_12.ContentEditable: (f) => new import_12.ContentEditable(f(import_10.Element), f(import_12.NgModel), f(import_1.Scope), f(import_12.NgModelOptions)),
  import_12.NgPluralize: (f) => new import_12.NgPluralize(f(import_1.Scope), f(import_10.Element), f(import_1.Interpolate), f(import_1.FormatterMap)),
  import_12.NgRepeat: (f) => new import_12.NgRepeat(f(import_9.ViewPort), f(import_9.BoundViewFactory), f(import_1.Scope), f(import_5.Parser), f(import_1.FormatterMap)),
  import_12.NgTemplate: (f) => new import_12.NgTemplate(f(import_10.Element), f(import_9.TemplateCache)),
  import_12.NgHide: (f) => new import_12.NgHide(f(import_10.Element), f(import_9.Animate)),
  import_12.NgShow: (f) => new import_12.NgShow(f(import_10.Element), f(import_9.Animate)),
  import_12.NgBooleanAttribute: (f) => new import_12.NgBooleanAttribute(f(import_9.NgElement)),
  import_12.NgSource: (f) => new import_12.NgSource(f(import_9.NgElement)),
  import_12.NgAttribute: (f) => new import_12.NgAttribute(f(import_9.NodeAttrs)),
  import_12.NgStyle: (f) => new import_12.NgStyle(f(import_10.Element), f(import_1.Scope)),
  import_12.NgSwitch: (f) => new import_12.NgSwitch(f(import_1.Scope)),
  import_12.NgSwitchWhen: (f) => new import_12.NgSwitchWhen(f(import_12.NgSwitch), f(import_9.ViewPort), f(import_9.BoundViewFactory), f(import_1.Scope)),
  import_12.NgSwitchDefault: (f) => new import_12.NgSwitchDefault(f(import_12.NgSwitch), f(import_9.ViewPort), f(import_9.BoundViewFactory), f(import_1.Scope)),
  import_12.NgNonBindable: (f) => new import_12.NgNonBindable(),
  import_12.InputSelect: (f) => new import_12.InputSelect(f(import_10.Element), f(import_9.NodeAttrs), f(import_12.NgModel), f(import_1.Scope)),
  import_12.OptionValue: (f) => new import_12.OptionValue(f(import_10.Element), f(import_12.InputSelect), f(import_12.NgValue)),
  import_12.NgForm: (f) => new import_12.NgForm(f(import_1.Scope), f(import_9.NgElement), f(import_2.Injector), f(import_9.Animate)),
  import_12.NgModelRequiredValidator: (f) => new import_12.NgModelRequiredValidator(f(import_12.NgModel)),
  import_12.NgModelUrlValidator: (f) => new import_12.NgModelUrlValidator(f(import_12.NgModel)),
  import_12.NgModelEmailValidator: (f) => new import_12.NgModelEmailValidator(f(import_12.NgModel)),
  import_12.NgModelNumberValidator: (f) => new import_12.NgModelNumberValidator(f(import_12.NgModel)),
  import_12.NgModelMaxNumberValidator: (f) => new import_12.NgModelMaxNumberValidator(f(import_12.NgModel)),
  import_12.NgModelMinNumberValidator: (f) => new import_12.NgModelMinNumberValidator(f(import_12.NgModel)),
  import_12.NgModelPatternValidator: (f) => new import_12.NgModelPatternValidator(f(import_12.NgModel)),
  import_12.NgModelMinLengthValidator: (f) => new import_12.NgModelMinLengthValidator(f(import_12.NgModel)),
  import_12.NgModelMaxLengthValidator: (f) => new import_12.NgModelMaxLengthValidator(f(import_12.NgModel)),
  import_12.NgModelOptions: (f) => new import_12.NgModelOptions(),
  import_13.Currency: (f) => new import_13.Currency(),
  import_13.Date: (f) => new import_13.Date(),
  import_13.Filter: (f) => new import_13.Filter(f(import_5.Parser)),
  import_13.Json: (f) => new import_13.Json(),
  import_13.LimitTo: (f) => new import_13.LimitTo(f(import_2.Injector)),
  import_13.Lowercase: (f) => new import_13.Lowercase(),
  import_13.Arrayify: (f) => new import_13.Arrayify(),
  import_13.Number: (f) => new import_13.Number(),
  import_13.OrderBy: (f) => new import_13.OrderBy(f(import_5.Parser)),
  import_13.Uppercase: (f) => new import_13.Uppercase(),
  import_13.Stringify: (f) => new import_13.Stringify(),
  import_14.NgRoutingUsePushState: (f) => new import_14.NgRoutingUsePushState(),
  import_14.NgRoutingHelper: (f) => new import_14.NgRoutingHelper(f(import_14.RouteInitializer), f(import_2.Injector), f(import_15.Router), f(import_16.Application)),
  import_14.NgView: (f) => new import_14.NgView(f(import_10.Element), f(import_9.ViewCache), f(import_2.Injector), f(import_15.Router), f(import_1.Scope)),
  import_14.NgBindRoute: (f) => new import_14.NgBindRoute(f(import_15.Router), f(import_2.Injector), f(import_14.NgRoutingHelper)),
  import_11.Profiler: (f) => new import_11.Profiler(),
};
