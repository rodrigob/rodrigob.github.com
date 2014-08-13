/**
 * Bootstrapping for Angular applications via code generation, for production.
 *
 * Most angular.dart apps rely on static transformation at compile time to generate the artifacts
 * needed for tree shaking during compilation with `dart2js`. However,
 * if your deployment environment makes it impossible for you to use transformers,
 * you can call [staticApplicationFactory](#angular-app-factory-static@id_staticApplicationFactory)
 * directly in your `main()` function, and explicitly define the getters, setters, annotations, and
 * factories yourself.
 *
 *     import 'package:angular/angular.dart';
 *     import 'package:angular/application_factory_static.dart';
 *
 *     class MyModule extends Module {
 *       MyModule() {
 *         bind(HelloWorldController);
 *       }
 *     }
 *
 *     main() {
 *       staticApplicationFactory()
 *           .addModule(new MyModule())
 *           .run();
 *     }
 *
 * Note that you must explicitly import both
 * `angular.dart` and `application_factory_static.dart` at the start of your file. See [staticApplicationFactory]
 * (#angular-app-factory-static@id_staticApplicationFactory) for more on explicit definitions required with this
 * library.
 */
library angular.app.factory.static;

import 'package:di/static_injector.dart';
import 'package:di/di.dart' show TypeFactory, Injector;
import 'package:angular/application.dart';
import 'package:angular/core/registry.dart';
import 'package:angular/core/parser/parser.dart';
import 'package:angular/core/parser/parser_static.dart';
import 'package:angular/core/parser/dynamic_parser.dart';
import 'package:angular/core/registry_static.dart';
import 'package:angular/change_detection/change_detection.dart';
import 'package:angular/change_detection/dirty_checking_change_detector_static.dart';

export 'package:angular/change_detection/change_detection.dart' show
    FieldGetter,
    FieldSetter;

class _StaticApplication extends Application {
  final Map<Type, TypeFactory> typeFactories;

  _StaticApplication(Map<Type, TypeFactory> this.typeFactories,
               Map<Type, Object> metadata,
               Map<String, FieldGetter> fieldGetters,
               Map<String, FieldSetter> fieldSetters,
               Map<String, Symbol> symbols) {
    ngModule
        ..bind(MetadataExtractor, toValue: new StaticMetadataExtractor(metadata))
        ..bind(FieldGetterFactory, toValue: new StaticFieldGetterFactory(fieldGetters))
        ..bind(ClosureMap, toValue: new StaticClosureMap(fieldGetters, fieldSetters, symbols));
  }

  Injector createInjector() =>
      new StaticInjector(modules: modules, typeFactories: typeFactories);
}

/**
 * Bootstraps Angular as part of the `main()` function.
 *
 * `staticApplication()` replaces `dynamicApplication()` in the main function during pub build,
 * and is populated with the getters, setters, annotations, and factories generated by
 * Angular's transformers for dart2js compilation. It is not typically called directly.
 *
 * For example,
 *
 *     main() {
 *       applicationFactory()
 *       .addModule(new Module()..bind(HelloWorld))
 *       .run();
 *       }
 *
 * becomes:
 *
 *     main() {
 *       staticApplication(generated_static_injector.factories,
 *        generated_static_metadata.typeAnnotations,
 *        generated_static_expressions.getters,
 *        generated_static_expressions.setters,
 *        generated_static_expressions.symbols)
 *       .addModule(new Module()..bind(HelloWorldController))
 *       .run();
 *
 */
Application staticApplicationFactory(
    Map<Type, TypeFactory> typeFactories,
    Map<Type, Object> metadata,
    Map<String, FieldGetter> fieldGetters,
    Map<String, FieldSetter> fieldSetters,
    Map<String, Symbol> symbols) {
  return new _StaticApplication(typeFactories, metadata, fieldGetters, fieldSetters, symbols);
}
