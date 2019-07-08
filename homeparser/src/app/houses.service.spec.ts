import { TestBed } from '@angular/core/testing';

import { HousesService } from './houses.service';

describe('HousesService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: HousesService = TestBed.get(HousesService);
    expect(service).toBeTruthy();
  });
});
